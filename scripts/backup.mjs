// Backup script — snapshots ALL content + the OWNER's cloud progress to
// /backups/*.json (committed to git as a safety net; never imported by the app,
// so it adds nothing to the bundle).
//
//   node scripts/backup.mjs
// Needs SUPABASE_SERVICE_ROLE_KEY (secret) + VITE_SUPABASE_URL in env
// (.env.local locally; a GitHub Actions secret in CI).

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execSync } from 'node:child_process'

const OWNER_EMAIL = 'ksnkkc@gmail.com'   // only this account's progress is backed up

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
function loadEnv(file) {
  const p = join(ROOT, file)
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (line.trimStart().startsWith('#')) continue
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
loadEnv('.env'); loadEnv('.env.local')

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) { console.error('✖ Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const db = createClient(URL, KEY, { auth: { persistSession: false } })

// Read the counts of the CURRENT published snapshot (the single commit on the
// `backups` branch), so we never overwrite a good backup with a smaller one. A
// silent partial delete / truncated read would otherwise still pass the
// complete+duplicate-free integrity check and clobber the only copy. Best-effort:
// returns null on the first run, a missing branch, or no git/remote (then the
// guard is skipped — nothing to compare against).
function previousCounts() {
  try {
    execSync('git fetch origin backups --depth=1', { cwd: ROOT, stdio: 'ignore' })
    // content.json is several MB — raise maxBuffer well past execSync's 1MB default
    // (ENOBUFS otherwise). We only need the small `counts` object at its head.
    const prev = execSync('git show FETCH_HEAD:backups/content.json',
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
    const j = JSON.parse(prev)
    return (j && j.counts) || null
  } catch {
    return null
  }
}

async function fetchAll(table, columns, order = 'id') {
  const rows = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await db.from(table).select(columns).order(order).range(from, from + page - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...data)
    if (data.length < page) break
  }
  return rows
}

async function main() {
  const dir = join(ROOT, 'backups')
  if (!existsSync(dir)) mkdirSync(dir)

  // ── ALL content (MCQ / Written / Extra / Viva; payload holds each item whole) ──
  const questions = await fetchAll('questions', '*', 'id')
  const byModule = questions.reduce((m, q) => { m[q.module] = (m[q.module] || 0) + 1; return m }, {})

  // Integrity guard: snapshot must be COMPLETE and DUPLICATE-FREE, else fail loudly.
  const distinctQ = new Set(questions.map(q => q.id)).size
  const { count: dbQ } = await db.from('questions').select('*', { count: 'exact', head: true })
  if (distinctQ !== questions.length || questions.length !== dbQ) {
    throw new Error(`integrity check failed — ${questions.length} rows (${distinctQ} distinct) vs DB ${dbQ}`)
  }

  // Shrink guard: refuse to replace the single snapshot with a SMALLER dataset,
  // so an accidental mass-delete can't silently wipe the only backup. Growth and
  // equality are fine. Set ALLOW_SHRINK=1 to override when a deletion is intended.
  const prev = previousCounts()
  if (prev && process.env.ALLOW_SHRINK !== '1') {
    if (questions.length < prev.questions) {
      throw new Error(
        `shrink guard: current (${questions.length} questions) is smaller than ` +
        `the last snapshot (${prev.questions} questions). Refusing to overwrite the ` +
        `backup. If this deletion is intentional, re-run with ALLOW_SHRINK=1.`)
    }
    console.log(`shrink guard OK — ${questions.length} ≥ ${prev.questions} questions`)
  } else if (!prev) {
    console.log('shrink guard skipped — no previous snapshot to compare against')
  }

  writeFileSync(join(dir, 'content.json'), JSON.stringify({
    counts: { questions: questions.length, byModule },
    questions,
  }, null, 2))
  console.log(`content.json → ${questions.length} questions`, byModule)

  // ── OWNER's cloud progress only ──
  const { data: { users }, error: uErr } = await db.auth.admin.listUsers({ perPage: 1000 })
  if (uErr) throw uErr
  const owner = users.find(u => u.email === OWNER_EMAIL)
  let progress = []
  if (owner) {
    const { data, error } = await db.from('user_progress').select('*').eq('user_id', owner.id)
    if (error) throw error
    progress = data
  }
  writeFileSync(join(dir, 'progress.json'), JSON.stringify({
    owner: OWNER_EMAIL,
    count: progress.length,
    nailed: progress.filter(p => p.nailed).length,
    important: progress.filter(p => p.important).length,
    progress,
  }, null, 2))
  console.log(`progress.json → ${progress.length} rows for ${OWNER_EMAIL}${owner ? '' : ' (owner not found)'}`)
}

main().catch(e => { console.error('✖ Backup failed:', e.message); process.exit(1) })
