// Supabase read/write for per-user progress (nailed / important), keyed by the
// stable question `uid`. All calls are RLS-scoped to the logged-in user.
import { supabase } from './supabase.js'

// Load the user's full progress into two Sets of uids, plus the most recent
// updated_at (for a "last saved" indicator).
export async function fetchProgress() {
  const { data, error } = await supabase
    .from('user_progress')
    .select('uid, nailed, important, updated_at')
  if (error) throw error
  const nailed = new Set()
  const important = new Set()
  let lastUpdated = null
  for (const r of data) {
    if (r.nailed) nailed.add(r.uid)
    if (r.important) important.add(r.uid)
    if (r.updated_at && (!lastUpdated || r.updated_at > lastUpdated)) lastUpdated = r.updated_at
  }
  return { nailed, important, lastUpdated }
}

// Bulk-upsert a coalesced batch of flag changes in as few requests as possible.
// `batch` = [{ uid, patch: { nailed?, important? } }] where each patch holds only
// the columns that actually changed (so an untouched column is never clobbered).
//
// PostgREST bulk upsert derives its column list from the rows, so rows with
// different key-sets can't share one request — we group by key signature
// (nailed-only / important-only / both) and send one upsert per group.
// Throws on the first error so the caller (offlineQueue) can keep the batch
// queued and back off.
export async function bulkUpsert(userId, batch) {
  const groups = new Map()
  for (const { uid, patch } of batch) {
    if (!uid || !patch) continue
    const sig = Object.keys(patch).sort().join(',')   // '', 'important', 'nailed', 'important,nailed'
    if (!sig) continue
    if (!groups.has(sig)) groups.set(sig, [])
    groups.get(sig).push({ user_id: userId, uid, ...patch })
  }
  for (const rows of groups.values()) {
    const { error } = await supabase
      .from('user_progress')
      .upsert(rows, { onConflict: 'user_id,uid' })
    if (error) throw new Error(error.message)
  }
}
