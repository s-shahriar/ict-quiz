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

// Upsert a single flag change. `patch` is { nailed?, important? }; only the
// provided column is written, the other is left untouched on existing rows.
export async function upsertFlag(userId, uid, patch) {
  const { error } = await supabase
    .from('user_progress')
    .upsert({ user_id: userId, uid, ...patch }, { onConflict: 'user_id,uid' })
  if (error) console.error('[progress] upsert failed:', error.message)
}
