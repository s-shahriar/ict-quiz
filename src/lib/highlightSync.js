// Supabase read/write for per-user text highlights, keyed by the stable
// question `uid` plus a block key inside that answer. RLS-scoped to the user,
// same as user_progress.
import { supabase } from './supabase.js'

const fromRow = (r) => ({
  id: r.id, uid: r.uid, block: r.block,
  start: r.start_off, end: r.end_off, quote: r.quote,
})

// Every highlight the user has, grouped by question uid. One request — the
// volume is small (a few hundred at most) and the Written module needs them
// available the moment a card is expanded.
export async function fetchHighlights() {
  const { data, error } = await supabase
    .from('user_highlights')
    .select('id, uid, block, start_off, end_off, quote')
    .order('start_off')
  if (error) throw error
  const byUid = new Map()
  for (const r of data) {
    const h = fromRow(r)
    if (!byUid.has(h.uid)) byUid.set(h.uid, [])
    byUid.get(h.uid).push(h)
  }
  return byUid
}

// Insert one or more anchors (a selection spanning several blocks makes several)
// and return them with their real ids.
export async function insertHighlights(userId, anchors) {
  const rows = anchors.map(a => ({
    user_id: userId, uid: a.uid, block: a.block,
    start_off: a.start, end_off: a.end, quote: a.quote,
  }))
  const { data, error } = await supabase
    .from('user_highlights')
    .insert(rows)
    .select('id, uid, block, start_off, end_off, quote')
  if (error) throw error
  return data.map(fromRow)
}

export async function deleteHighlights(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('user_highlights').delete().in('id', ids)
  if (error) throw error
}
