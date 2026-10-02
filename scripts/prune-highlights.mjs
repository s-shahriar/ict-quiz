// Deletes highlight rows that can no longer be shown.
//
// textAnchor.js deliberately never deletes a highlight it cannot place, so that a
// wording change cannot silently destroy marks. The user prefers the opposite:
// when content is edited, marks on text that changed may go, but they must not
// pile up in `user_highlights` as dead rows. This script is that cleanup.
//
// A row is dead when, against the content as it is NOW:
//   - its question row no longer exists (deleted forever, or uid changed), or
//   - its block no longer exists, or the app's own resolveAnchor() cannot place
//     its quote in that block (the same test that hides it in the app), or
//   - it marks a note that has since been cleared.
// Kept on purpose: highlights on questions sitting in the Recycle Bin (they come
// back on restore), Practice highlights, and any block key this script does not
// model — when in doubt, keep.
//
//   node scripts/prune-highlights.mjs --dry   list what would be deleted
//   node scripts/prune-highlights.mjs         delete it
//
// sync-written.mjs runs this after every sync, so written edits clean up after
// themselves. Run it by hand after editing equations or MCQs.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { resolveAnchor } from '../src/lib/textAnchor.js'
import { uidFor } from '../src/lib/qid.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

async function readAll(sb, table, cols, key) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(cols).order(key).range(from, from + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) return out
  }
}

// Current text of a question block, mirroring the keys WrittenCardBody,
// WrittenQuestionText, QuestionText and the MCQ explanation build.
// undefined = the block no longer exists; null = a key this script does not model.
function questionBlock(q, block) {
  const a = q.payload?.answer || {}, ext = a.extended || {}
  const at = (arr, i) => (Array.isArray(arr) ? arr[i] : undefined)
  const line = (v) => (typeof v === 'string' ? v : v?.sub)
  let m
  if (block === 'q' || block === 'q.code' || /^q\.\d+$/.test(block)) return q.question
  if (block === 'explanation') return q.payload?.explanation
  if (block === 'summary') return typeof a.summary === 'string' ? a.summary : undefined
  if ((m = block.match(/^summary\.(\d+)$/))) return at(a.summary, +m[1])
  if ((m = block.match(/^points\.(\d+)\.diagram$/))) return at(a.points, +m[1])?.diagram
  if ((m = block.match(/^points\.(\d+)$/))) return line(at(a.points, +m[1]))
  if (block === 'diagram') return a.diagram
  if (block === 'mnemonic') return a.mnemonic
  if ((m = block.match(/^mistakes\.r(\d+)\.c(\d+)$/))) return at(at(a.mistakes, +m[1]), +m[2])
  if ((m = block.match(/^table\.r(\d+)\.c(\d+)$/))) return at(at(a.table?.rows, +m[1]), +m[2])
  if ((m = block.match(/^ext\.points\.(\d+)$/))) return line(at(ext.points, +m[1]))
  if ((m = block.match(/^ext\.table\.r(\d+)\.c(\d+)$/))) return at(at(ext.table, +m[1]), +m[2])
  if (block === 'ext.diagram') return ext.diagram
  return null
}

// Equation content is bundled code, so read it from the data files. One map per
// group card: block key -> text (a formula maps to '' — any mark on it covers the
// whole formula, so it lives exactly as long as the equation does).
async function equationBlocks() {
  const dir = join(ROOT, 'src/data/equation')
  const groups = new Map()
  for (const f of readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'index.js')) {
    const { default: data } = await import(pathToFileURL(join(dir, f)).href)
    for (const g of data.groups) {
      const blocks = new Map([['caption', g.caption], ['mnemonic', g.mnemonic]])
      for (const [sym, meaning] of g.symbols || []) blocks.set(`sym:${sym}`, meaning)
      for (const eq of g.equations) {
        blocks.set(`eq:${eq.name}.name`, eq.name)
        blocks.set(`eq:${eq.name}.formula`, '')
        if (eq.note) blocks.set(`eq:${eq.name}.note`, eq.note)
      }
      groups.set(uidFor('equation', `${data.category}/${g.id}`), blocks)
    }
  }
  return groups
}

const placeable = (text, h) => typeof text === 'string' &&
  !!resolveAnchor(text, { start: h.start_off, end: h.end_off, quote: h.quote })

export async function pruneHighlights(sb, { dry = false, log = console.log } = {}) {
  const [hls, qs, progress, eqGroups] = await Promise.all([
    readAll(sb, 'user_highlights', 'id, uid, block, start_off, end_off, quote', 'id'),
    readAll(sb, 'questions', 'uid, question, payload', 'id'),
    readAll(sb, 'user_progress', 'uid, note', 'uid'),
    equationBlocks(),
  ])
  const byUid = new Map(qs.map(q => [q.uid, q]))
  const notes = new Map(progress.filter(p => p.note).map(p => [p.uid, p.note]))

  const dead = [], kept = { unmodelled: 0, practice: 0 }
  for (const h of hls) {
    if (h.uid.startsWith('practice')) { kept.practice++; continue }
    let alive
    if (h.uid.startsWith('equation:')) {
      const blocks = eqGroups.get(h.uid)
      const text = blocks?.get(h.block)
      alive = h.block.endsWith('.formula') ? text !== undefined : placeable(text, h)
    } else if (h.block === 'note') {
      alive = placeable(notes.get(h.uid), h)
    } else {
      const q = byUid.get(h.uid)
      if (!q) alive = false
      else {
        const text = questionBlock(q, h.block)
        if (text === null) { kept.unmodelled++; continue }
        alive = /^q(\.\d+|\.code)?$/.test(h.block)
          ? typeof text === 'string' && text.includes(h.quote)
          : placeable(text, h)
      }
    }
    if (!alive) dead.push(h)
  }

  log(`highlights: ${hls.length} · dead: ${dead.length} · kept unchecked: ${kept.practice} practice, ${kept.unmodelled} unmodelled`)
  dead.forEach(h => log(`  ${dry ? 'would delete' : 'delete'} ${h.uid} ${h.block} "${h.quote.slice(0, 40)}"`))
  if (dry || !dead.length) return dead.length

  for (let i = 0; i < dead.length; i += 200) {
    const { error } = await sb.from('user_highlights').delete().in('id', dead.slice(i, i + 200).map(h => h.id))
    if (error) throw error
  }
  log(`✓ deleted ${dead.length} dead highlight(s)`)
  return dead.length
}

// CLI
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.chdir(ROOT)
  for (const f of ['.env', '.env.local']) {
    if (!existsSync(f)) continue
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (line.trimStart().startsWith('#')) continue
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  await pruneHighlights(sb, { dry: process.argv.includes('--dry') })
}
