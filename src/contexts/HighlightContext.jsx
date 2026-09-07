import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import {
  fetchHighlights, insertHighlights, deleteHighlights, recolorHighlights, DEFAULT_COLOR,
} from '../lib/highlightSync.js'

// PDF-style text highlights across the Written / Extra / Viva / Code answers.
//
// EDITING IS LOCAL. Highlighting, removing and recolouring only change memory —
// no request is made until you press Save. That keeps a reading session at zero
// network traffic and makes the whole thing work with no connection.
//
// Three pending sets describe the unsaved work:
//   adds    — new highlights, temporary ids
//   deletes — ids of saved rows to drop
//   edits   — id → new colour, for saved rows
// The rendered set is `saved − deletes + adds`, with `edits` applied on top.
//
// Pending work is mirrored to localStorage per user, so closing the tab with
// unsaved highlights does not lose them; they are still pending on return.

const HighlightContext = createContext(null)
const EMPTY = []
const LS_KEY = (userId) => `ict_hl_pending_${userId}`

function loadPending(userId) {
  try {
    const raw = localStorage.getItem(LS_KEY(userId))
    if (!raw) return null
    const p = JSON.parse(raw)
    return {
      adds: Array.isArray(p.adds) ? p.adds : [],
      deletes: new Set(Array.isArray(p.deletes) ? p.deletes : []),
      edits: new Map(Array.isArray(p.edits) ? p.edits : []),
    }
  } catch { return null }
}

function savePending(userId, adds, deletes, edits) {
  try {
    if (!adds.length && !deletes.size && !edits.size) localStorage.removeItem(LS_KEY(userId))
    else localStorage.setItem(LS_KEY(userId), JSON.stringify({
      adds, deletes: [...deletes], edits: [...edits],
    }))
  } catch { /* private mode / quota — pending work simply is not mirrored */ }
}

export function HighlightProvider({ children }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(() => new Map())
  const [adds, setAdds] = useState([])
  const [deletes, setDeletes] = useState(() => new Set())
  const [edits, setEdits] = useState(() => new Map())
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [status, setStatus] = useState('idle')     // idle | saving | error
  const [error, setError] = useState(null)
  const seq = useRef(0)

  // Load saved highlights + any pending work left from a previous visit.
  useEffect(() => {
    if (!user) { setSaved(new Map()); setAdds([]); setDeletes(new Set()); setEdits(new Map()); return }
    const p = loadPending(user.id)
    if (p) { setAdds(p.adds); setDeletes(p.deletes); setEdits(p.edits) }
    let cancelled = false
    fetchHighlights()
      .then(m => { if (!cancelled) setSaved(m) })
      .catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => { if (user) savePending(user.id, adds, deletes, edits) }, [user, adds, deletes, edits])

  // Warn before losing unsaved highlights on a tab close / refresh.
  const dirtyCount = adds.length + deletes.size + edits.size
  useEffect(() => {
    if (!dirtyCount) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirtyCount])

  // What the renderer sees: saved rows minus pending deletes, with pending
  // colour edits applied, plus pending adds.
  const byUid = useMemo(() => {
    const out = new Map()
    for (const [uid, list] of saved) {
      const kept = list
        .filter(h => !deletes.has(h.id))
        .map(h => edits.has(h.id) ? { ...h, color: edits.get(h.id) } : h)
      if (kept.length) out.set(uid, kept)
    }
    for (const a of adds) {
      if (!out.has(a.uid)) out.set(a.uid, [])
      out.set(a.uid, [...out.get(a.uid), a])
    }
    return out
  }, [saved, adds, deletes, edits])

  const getFor = useCallback((uid) => byUid.get(uid) || EMPTY, [byUid])

  const add = useCallback((uid, anchors, c) => {
    if (!uid || !anchors?.length) return
    const chosen = c || color
    setAdds(list => [...list, ...anchors.map(a => ({
      ...a, uid, color: chosen, id: `tmp-${Date.now()}-${seq.current++}`,
    }))])
  }, [color])

  const remove = useCallback((uid, ids) => {
    if (!ids?.length) return
    const gone = new Set(ids)
    setAdds(list => list.filter(a => !gone.has(a.id)))        // pending ones just vanish
    setDeletes(d => {
      const n = new Set(d)
      for (const id of ids) if (!String(id).startsWith('tmp-')) n.add(id)
      return n
    })
    setEdits(e => {                                            // an edit on a deleted row is moot
      if (!ids.some(id => e.has(id))) return e
      const n = new Map(e); for (const id of ids) n.delete(id); return n
    })
  }, [])

  const recolor = useCallback((uid, ids, c) => {
    if (!ids?.length || !c) return
    const set = new Set(ids)
    setAdds(list => list.map(a => set.has(a.id) ? { ...a, color: c } : a))
    setEdits(e => {
      const n = new Map(e)
      for (const id of ids) if (!String(id).startsWith('tmp-')) n.set(id, c)
      return n
    })
  }, [])

  const save = useCallback(async () => {
    if (!user || !dirtyCount || status === 'saving') return false
    setStatus('saving'); setError(null)
    try {
      const inserted = await insertHighlights(user.id, adds)
      await deleteHighlights([...deletes])
      await recolorHighlights([...edits])
      setSaved(prev => {
        const next = new Map()
        for (const [uid, list] of prev) {
          const kept = list
            .filter(h => !deletes.has(h.id))
            .map(h => edits.has(h.id) ? { ...h, color: edits.get(h.id) } : h)
          if (kept.length) next.set(uid, kept)
        }
        for (const h of inserted) next.set(h.uid, [...(next.get(h.uid) || []), h])
        return next
      })
      setAdds([]); setDeletes(new Set()); setEdits(new Map())
      setStatus('idle')
      return true
    } catch (e) {
      setError(e.message); setStatus('error')
      return false                       // pending work is kept so Save can be retried
    }
  }, [user, adds, deletes, edits, dirtyCount, status])

  const discard = useCallback(() => {
    setAdds([]); setDeletes(new Set()); setEdits(new Map()); setError(null); setStatus('idle')
  }, [])

  const value = {
    getFor, add, remove, recolor, save, discard,
    color, setColor,
    dirtyCount, status, error,
    canHighlight: Boolean(user),
  }
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>
}

export function useHighlights() {
  return useContext(HighlightContext) || {
    getFor: () => EMPTY, add: () => {}, remove: () => {}, recolor: () => {},
    save: async () => false, discard: () => {},
    color: DEFAULT_COLOR, setColor: () => {},
    dirtyCount: 0, status: 'idle', error: null, canHighlight: false,
  }
}
