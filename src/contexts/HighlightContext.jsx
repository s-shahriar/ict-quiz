import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchHighlights, insertHighlights, deleteHighlights } from '../lib/highlightSync.js'

// PDF-style text highlights across the Written / Extra / Viva / Code answer
// bodies. Loaded once per session and kept in a Map keyed by question uid, so
// expanding a card costs nothing.
//
// Writes are optimistic with rollback: the mark appears (or disappears) the
// instant you tap, and only reverts if Supabase rejects it. There is no offline
// queue here on purpose — unlike a nail/important flag, a highlight is anchored
// to text that may have been edited, so replaying a stale write later could land
// it in the wrong place. A failed write says so and leaves the text unmarked.

const HighlightContext = createContext(null)
const EMPTY = []

export function HighlightProvider({ children }) {
  const { user } = useAuth()
  const [byUid, setByUid] = useState(() => new Map())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) { setByUid(new Map()); setReady(false); return }
    let cancelled = false
    fetchHighlights()
      .then(m => { if (!cancelled) { setByUid(m); setReady(true) } })
      .catch(e => { if (!cancelled) { setError(e.message); setReady(true) } })
    return () => { cancelled = true }
  }, [user])

  const getFor = useCallback((uid) => byUid.get(uid) || EMPTY, [byUid])

  // anchors: [{ block, start, end, quote }] from one selection, all in `uid`.
  const add = useCallback(async (uid, anchors) => {
    if (!user || !uid || !anchors?.length) return false
    const temp = anchors.map((a, i) => ({ ...a, uid, id: `tmp-${Date.now()}-${i}` }))
    setByUid(m => new Map(m).set(uid, [...(m.get(uid) || []), ...temp]))
    try {
      const saved = await insertHighlights(user.id, temp.map(a => ({ ...a, uid })))
      setByUid(m => {
        const next = new Map(m)
        const tempIds = new Set(temp.map(t => t.id))
        next.set(uid, [...(next.get(uid) || []).filter(h => !tempIds.has(h.id)), ...saved])
        return next
      })
      return true
    } catch (e) {
      setByUid(m => {                                     // rollback
        const next = new Map(m)
        const tempIds = new Set(temp.map(t => t.id))
        next.set(uid, (next.get(uid) || []).filter(h => !tempIds.has(h.id)))
        return next
      })
      setError(e.message)
      return false
    }
  }, [user])

  const remove = useCallback(async (uid, ids) => {
    if (!user || !ids?.length) return false
    const gone = new Set(ids)
    const before = byUid.get(uid) || EMPTY
    setByUid(m => new Map(m).set(uid, (m.get(uid) || []).filter(h => !gone.has(h.id))))
    try {
      await deleteHighlights(ids.filter(id => !String(id).startsWith('tmp-')))
      return true
    } catch (e) {
      setByUid(m => new Map(m).set(uid, before))          // rollback
      setError(e.message)
      return false
    }
  }, [user, byUid])

  const value = { getFor, add, remove, ready, canHighlight: Boolean(user), error, clearError: () => setError(null) }
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>
}

export function useHighlights() {
  return useContext(HighlightContext) || {
    getFor: () => EMPTY, add: async () => false, remove: async () => false,
    ready: false, canHighlight: false, error: null, clearError: () => {},
  }
}
