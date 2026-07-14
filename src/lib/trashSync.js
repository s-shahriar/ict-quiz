// Recycle-bin (soft-delete) data layer. Delete is global curation: an owner-gated
// RPC sets `deleted_at`, and the content loader hides anything with a non-null
// deleted_at. Restore clears it; purge removes the row for good.
import { supabase } from './supabase.js'

export async function trashQuestion(id) {
  const { error } = await supabase.rpc('trash_question', { p_id: id })
  if (error) throw new Error(error.message)
}
export async function restoreQuestion(id) {
  const { error } = await supabase.rpc('restore_question', { p_id: id })
  if (error) throw new Error(error.message)
}
export async function purgeQuestion(id) {
  const { error } = await supabase.rpc('purge_question', { p_id: id })
  if (error) throw new Error(error.message)
}

// Everything in the recycle bin, newest-deleted first.
export async function fetchDeletedQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, uid, module, category_slug, question, payload, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(r => ({
    ...(r.payload || {}),
    _id: r.id, _uid: r.uid, _module: r.module, _slug: r.category_slug,
    question: r.question ?? r.payload?.question ?? '',
    deleted_at: r.deleted_at,
  }))
}
