// Local dev server — mirrors api/sync.js for use with `npm run dev`
// Run: node dev-server.js (in a separate terminal)
import { MongoClient } from 'mongodb'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const env = Object.fromEntries(
  readFileSync(resolve('.env.local'), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const MONGODB_URI = env.MONGODB_URI
const API_KEY     = env.API_KEY
const PORT        = 3001

const client = new MongoClient(MONGODB_URI)
let db
async function getDb() {
  if (!db) { await client.connect(); db = client.db() }
  return db
}

const server = createServer(async (req, res) => {
  if (req.url !== '/api/sync') { res.writeHead(404); res.end(); return }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token !== API_KEY) { res.writeHead(401); res.end(JSON.stringify({ error: 'Unauthorized' })); return }

  const database = await getDb()
  const col = database.collection('prefs')

  if (req.method === 'GET') {
    const doc = await col.findOne({ _id: 'user_prefs' })
    res.writeHead(200)
    res.end(JSON.stringify({ mastered: doc?.mastered ?? [], theme: doc?.theme ?? 'light' }))
    return
  }

  if (req.method === 'POST') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', async () => {
      const { mastered, theme } = JSON.parse(body)
      await col.updateOne(
        { _id: 'user_prefs' },
        { $set: { mastered, theme, updatedAt: new Date() } },
        { upsert: true }
      )
      res.writeHead(200)
      res.end(JSON.stringify({ ok: true }))
    })
    return
  }

  res.writeHead(405); res.end()
})

server.listen(PORT, () => console.log(`Dev API server on http://localhost:${PORT}`))
