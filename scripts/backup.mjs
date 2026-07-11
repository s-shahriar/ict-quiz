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
  const questions = await fetchAll('questions', '*', 'sort_order')
  const byModule = questions.reduce((m, q) => { m[q.module] = (m[q.module] || 0) + 1; return m }, {})
  writeFileSync(join(dir, 'content.json'), JSON.stringify({
    exported_at: new Date().toISOString(),
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
    exported_at: new Date().toISOString(),
    owner: OWNER_EMAIL,
    count: progress.length,
    nailed: progress.filter(p => p.nailed).length,
    important: progress.filter(p => p.important).length,
    progress,
  }, null, 2))
  console.log(`progress.json → ${progress.length} rows for ${OWNER_EMAIL}${owner ? '' : ' (owner not found)'}`)
}

main().catch(e => { console.error('✖ Backup failed:', e.message); process.exit(1) })
