// Makes Supabase match the written-Q&A JSON source of truth.
// Syncs payload, category_slug and sort_order — so moving a question between
// categories (or reordering one) is picked up, not just answer edits.
// Safe to re-run: `q` text is the uid source and is never changed by a rewrite,
// so a move keeps the row (and the user's Important/Nailed flags) intact.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { uidFor } from '../src/lib/qid.js'

function loadEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (line.trimStart().startsWith('#')) continue
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    if (!(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(ROOT)
loadEnv('.env'); loadEnv('.env.local')

const DRY = process.argv.includes('--dry')
const DIR = 'src/data/written'

const local = []
for (const f of readdirSync(DIR).filter(f => f.endsWith('.json')).sort()) {
  const slug = f.replace(/\.json$/, '')
  const data = JSON.parse(readFileSync(join(DIR, f), 'utf8'))
  data.questions.forEach((q, i) => {
    local.push({ slug, id: q.id, uid: uidFor('written', q.q), payload: q, sort_order: i })
  })
}
console.log(`local written questions: ${local.length}`)

const dupes = local.filter((r, i) => local.findIndex(x => x.uid === r.uid) !== i)
if (dupes.length) {
  console.error('✖ duplicate uids (two questions share `q` text):', dupes.map(d => `${d.slug}/${d.id}`))
  process.exit(1)
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const existing = new Map()
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('questions').select('uid, category_slug, sort_order, payload')
    .eq('module', 'written').range(from, from + 999)
  if (error) throw error
  data.forEach(r => existing.set(r.uid, r))
  if (data.length < 1000) break
}
console.log(`supabase written rows: ${existing.size}`)

// A question the user deleted forever in the app is purged from Supabase but
// still sits in the JSON. Never re-insert those — this script only updates rows
// that exist. It reports them so the JSON can be reconciled deliberately.
const missing = local.filter(r => !existing.has(r.uid))
if (missing.length) {
  console.warn(`\n⚠ ${missing.length} local question(s) have no Supabase row — skipped, not re-inserted:`)
  missing.forEach(m => console.warn(`    ${m.slug}/${m.id} — ${m.payload.q.slice(0, 70)}`))
  console.warn('  (deleted in-app? reconcile the JSON if so.)\n')
}
const syncable = local.filter(r => existing.has(r.uid))

// Postgres jsonb does not preserve key order, so compare canonically or every
// row looks "changed" on every run.
function canon(v) {
  if (Array.isArray(v)) return v.map(canon)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])]))
  return v
}

const changed = []
for (const r of syncable) {
  const e = existing.get(r.uid)
  const patch = {}
  if (e.category_slug !== r.slug) patch.category_slug = r.slug
  if (e.sort_order !== r.sort_order) patch.sort_order = r.sort_order
  if (JSON.stringify(canon(e.payload)) !== JSON.stringify(canon(r.payload))) patch.payload = r.payload
  if (Object.keys(patch).length) changed.push({ ...r, patch, was: e.category_slug })
}
console.log(`rows needing update: ${changed.length}`)
const moves = changed.filter(c => c.patch.category_slug)
if (moves.length) {
  console.log('  category moves:')
  moves.forEach(m => console.log(`    ${m.id}: ${m.was} -> ${m.patch.category_slug}`))
}
if (DRY) {
  changed.filter(c => !c.patch.category_slug)
    .forEach(c => console.log(`    would update ${c.slug}/${c.id} [${Object.keys(c.patch).join(', ')}]`))
  process.exit(0)
}

// (module, category_slug, sort_order) is UNIQUE, so assigning final positions
// one row at a time collides mid-flight whenever two rows swap slots or a row
// moves into an occupied one. Park every changing row at a temporary slot far
// past any real index first, then write the final values.
const reorder = changed.filter(c => 'sort_order' in c.patch || 'category_slug' in c.patch)
if (reorder.length) {
  console.log(`  parking ${reorder.length} row(s) at temporary slots…`)
  for (const [i, c] of reorder.entries()) {
    const { error } = await supabase.from('questions')
      .update({ sort_order: 100000 + i }).eq('uid', c.uid)
    if (error) throw error
  }
}

let done = 0
for (const c of changed) {
  const { error } = await supabase.from('questions').update(c.patch).eq('uid', c.uid)
  if (error) throw error
  if (++done % 20 === 0) console.log(`  ${done}/${changed.length}`)
}
console.log(`✓ updated ${done} rows`)
