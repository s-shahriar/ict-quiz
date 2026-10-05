// Upserts the data-shaped, non-question content (Practice, Equation) into the
// `content_blobs` table, so the web app and Slate read one copy.
//   node scripts/sync-static.mjs [--dry]
// Source files stay in src/data until the web app reads from the DB; after that
// they are only the authoring source this script publishes from.
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createClient } from '@supabase/supabase-js'

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
const rows = []

// Practice: one row per category (linux, sql).
rows.push({ kind: 'practice', key: 'linux', sort_order: 0, payload: JSON.parse(readFileSync('src/data/practice/linux.json', 'utf8')) })
rows.push({ kind: 'practice', key: 'sql', sort_order: 1, payload: JSON.parse(readFileSync('src/data/practice/sql.json', 'utf8')) })

// Equation: one row per category; the module default export is a plain object.
const EQUATION = ['computer_network', 'operating_system']
for (const [i, slug] of EQUATION.entries()) {
  const mod = await import(pathToFileURL(join(ROOT, `src/data/equation/${slug}.js`)).href)
  rows.push({ kind: 'equation', key: slug, sort_order: i, payload: JSON.parse(JSON.stringify(mod.default)) })
}

for (const r of rows) console.log(`${r.kind}/${r.key}: ${JSON.stringify(r.payload).length} bytes`)
if (DRY) { console.log('dry run, nothing written'); process.exit(0) }

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { error } = await supabase
  .from('content_blobs')
  .upsert(rows.map(r => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'kind,key' })
if (error) { console.error(error); process.exit(1) }
console.log(`upserted ${rows.length} rows`)
