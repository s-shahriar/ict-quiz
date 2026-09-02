// Pushes every written-Q&A payload from the JSON source of truth to Supabase.
// Safe to re-run: `q` text is never changed by a rewrite, so uids are stable and
// this is a pure payload update — no inserts, no deletes, no re-ordering.
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
  data.questions.forEach(q => {
    local.push({ slug, id: q.id, uid: uidFor('written', q.q), payload: q })
  })
}
console.log(`local written questions: ${local.length}`)

const dupes = local.filter((r, i) => local.findIndex(x => x.uid === r.uid) !== i)
if (dupes.length) {
  console.error('✖ duplicate uids (two questions share `q` text):', dupes.map(d => `${d.slug}/${d.id}`))
  process.exit(1)
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// pull existing rows in pages so we can diff before writing
const existing = new Map()
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('questions').select('uid, payload')
    .eq('module', 'written').range(from, from + 999)
  if (error) throw error
  data.forEach(r => existing.set(r.uid, r.payload))
  if (data.length < 1000) break
}
console.log(`supabase written rows: ${existing.size}`)

const missing = local.filter(r => !existing.has(r.uid))
if (missing.length) {
  console.error('✖ these local questions have no Supabase row (q text drifted?):',
    missing.map(m => `${m.slug}/${m.id}`))
  process.exit(1)
}

// Postgres jsonb does not preserve key order, so compare canonically (keys sorted)
// or every row would look "changed" on every run.
function canon(v) {
  if (Array.isArray(v)) return v.map(canon)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])]))
  }
  return v
}
const changed = local.filter(r => JSON.stringify(canon(existing.get(r.uid))) !== JSON.stringify(canon(r.payload)))
console.log(`payloads changed: ${changed.length}`)
if (DRY) {
  changed.forEach(c => console.log('  would update', `${c.slug}/${c.id}`))
  process.exit(0)
}

let done = 0
for (const c of changed) {
  const { error } = await supabase.from('questions').update({ payload: c.payload }).eq('uid', c.uid)
  if (error) throw error
  done++
  if (done % 20 === 0) console.log(`  ${done}/${changed.length}`)
}
console.log(`✓ updated ${done} payloads`)
