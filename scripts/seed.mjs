// Seed all Q&A content (MCQ / Written / Extra / Viva) into Supabase.
//   node scripts/seed.mjs [--dry]
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (secret) + VITE_SUPABASE_URL in .env.
// Practice is intentionally NOT seeded (stays bundled; only its flags sync).
//
// Every original item is stored WHOLE in `payload` (rich answers, options,
// page/note, tags, open-ended answers) so nothing is lost. uid matches the
// browser's uidFor() exactly.

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { uidFor } from '../src/lib/qid.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DRY = process.argv.includes('--dry') || process.env.DRY_RUN

function loadEnv(file) {
  const p = join(ROOT, file)
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (line.trimStart().startsWith('#')) continue
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    if (!(m[1] in process.env)) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}
loadEnv('.env'); loadEnv('.env.local')

const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!DRY && (!URL || !KEY)) {
  console.error('\n✖ Need VITE_SUPABASE_URL (.env) and SUPABASE_SERVICE_ROLE_KEY (.env.local).')
  console.error('  Get the secret key: Supabase Dashboard → Settings → API → Secret key\n')
  process.exit(1)
}
const db = DRY ? null : createClient(URL, KEY, { auth: { persistSession: false } })

// module → directory ('' = data root for MCQ)
const MODULES = [
  { module: 'mcq', dir: 'src/data', type: 'mcq' },
  { module: 'written', dir: 'src/data/written', type: 'written' },
  { module: 'extra', dir: 'src/data/extra', type: 'written' },
  { module: 'viva', dir: 'src/data/viva', type: 'written' },
]
const EXPECTED = { mcq: 647, written: 102, extra: 60, viva: 25 }

function jsonFiles(dir) {
  return readdirSync(join(ROOT, dir))
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => ({ slug: f.replace(/\.json$/, ''), path: join(ROOT, dir, f) }))
}

function buildRows() {
  const rows = []
  const perModule = {}
  for (const m of MODULES) {
    perModule[m.module] = 0
    for (const { slug, path } of jsonFiles(m.dir)) {
      const data = JSON.parse(readFileSync(path, 'utf8'))
      const items = data.questions || []
      items.forEach((item, i) => {
        const text = item.question ?? item.q ?? ''
        rows.push({
          uid: uidFor(m.module, text),
          module: m.module,
          category_slug: slug,
          type: item.type || m.type,
          question: text,
          payload: item,
          sort_order: i,
        })
        perModule[m.module]++
      })
    }
  }
  return { rows, perModule }
}

async function insertInBatches(rows, size = 400) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await db.from('questions').insert(rows.slice(i, i + size))
    if (error) throw new Error(`insert [${i}]: ${error.message}`)
  }
}

async function main() {
  const { rows, perModule } = buildRows()
  const total = rows.length
  const noUid = rows.filter(r => !r.uid).length
  const uids = new Set(rows.map(r => r.uid))

  console.log(DRY ? '→ DRY RUN (no writes)\n' : '→ Seeding…\n')
  for (const [mod, n] of Object.entries(perModule)) {
    const ok = n === EXPECTED[mod]
    console.log(`  ${ok ? '✓' : '✗'} ${mod.padEnd(9)} ${n} (expected ${EXPECTED[mod]})`)
  }
  console.log(`  TOTAL ${total} • ${uids.size} distinct uids • ${noUid} empty-text`)

  const expectedTotal = Object.values(EXPECTED).reduce((a, b) => a + b, 0)
  if (total !== expectedTotal || Object.entries(EXPECTED).some(([m, n]) => perModule[m] !== n)) {
    console.error(`\n✖ COUNT MISMATCH — expected ${expectedTotal}, got ${total}`)
    process.exit(1)
  }
  if (noUid) { console.error(`\n✖ ${noUid} items produced no uid (empty text)`) ; process.exit(1) }

  if (DRY) { console.log('\n✔ Dry run OK — ready to seed.'); return }

  console.log('\n→ Wiping + inserting…')
  await db.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await insertInBatches(rows)
  const { count } = await db.from('questions').select('*', { count: 'exact', head: true })
  console.log(`DB row count: ${count}`)
  if (count !== expectedTotal) { console.error(`✖ DB count ${count} != ${expectedTotal}`); process.exit(1) }
  console.log(`\n✔ Seed complete — ${count} items.`)
}

main().catch(e => { console.error('\n✖ Seed failed:', e.message); process.exit(1) })
