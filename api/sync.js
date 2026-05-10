import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI)
let db

async function getDb() {
  if (!db) { await client.connect(); db = client.db() }
  return db
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const database = await getDb()
  const col = database.collection('prefs')

  if (req.method === 'GET') {
    const doc = await col.findOne({ _id: 'user_prefs' })
    return res.json({ mastered: doc?.mastered ?? [], theme: doc?.theme ?? 'light' })
  }

  if (req.method === 'POST') {
    const { mastered, theme } = req.body
    await col.updateOne(
      { _id: 'user_prefs' },
      { $set: { mastered, theme, updatedAt: new Date() } },
      { upsert: true }
    )
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
