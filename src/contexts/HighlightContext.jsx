import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchHighlights, DEFAULT_COLOR } from '../lib/highlightSync.js'
import {
  subscribeQueue, onHighlightLanded,
  enqueueHighlightAdd, enqueueHighlightRemove, enqueueHighlightColor, highlightQueueReady,
} from '../lib/offlineQueue.js'

// PDF-style text highlights across the Written / Extra / Viva / Code answers and
// the Equation sheets.
//
// EDITING IS LOCAL UNTIL YOU PRESS SAVE. Highlighting, removing and recolouring
// only change memory (and a localStorage mirror) — no request is made and nothing
// is queued until Save. That keeps a reading session at zero network traffic and
// lets you discard a session's marks with the Undo on the Save bar.
//
// Three pending sets describe the unsaved work:
//   adds    — new highlights (each already has its final uuid)
//   deletes — ids of existing rows to drop
//   edits   — id → new colour, for existing rows
//
// SAVE HANDS THE PENDING WORK TO THE OFFLINE QUEUE (lib/offlineQueue.js — the one
// nail / important use). The queue sends it in the background, keeps it on this
// device while offline, retries with backoff, and lists each change in the Sync
// queue drawer with an Undo. So there are two layers under the screen:
//   settled = saved (what the server has, plus changes as they land)
//             with the queue's not-yet-landed highlight entries applied on top
//   local   = the unsaved sets above, applied on top of `settled`
// What is rendered is `settled − deletes + adds`, with `edits` applied. A change
// moves local → queue → saved without ever leaving the rendered set, because Save
// enqueues before it clears the local sets, in one batch.
//
// Highlight ids are uuids minted here, so an add keeps its id from the first tap
// to the database row: nothing has to be swapped after the insert lands.
//
// Unsaved work is mirrored to localStorage per user, so closing the tab with
// unsaved highlights does not lose them; they are still pending on return.

const HighlightContext = createContext(null)
const EMPTY = []
const LS_KEY = (userId) => `ict_hl_pending_${userId}`

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`)
// Pending adds saved by an older build carry a temporary id; Save gives them a real one.
const isTmp = (id) => String(id).startsWith('tmp-')

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

const findIn = (map, id) => {
  for (const list of map.values()) for (const h of list) if (h.id === id) return h
  return null
}

// Fold one change that has reached the server into the saved set.
function fold(prev, kind, hl) {
  const next = new Map(prev)
  const list = next.get(hl.uid) || []
  if (kind === 'hl_add') {
    if (!list.some(h => h.id === hl.id)) next.set(hl.uid, [...list, hl])
  } else if (kind === 'hl_del') {
    const kept = list.filter(h => h.id !== hl.id)
    if (kept.length) next.set(hl.uid, kept); else next.delete(hl.uid)
  } else if (kind === 'hl_color') {
    next.set(hl.uid, list.map(h => h.id === hl.id ? { ...h, color: hl.color } : h))
  }
  return next
}

export function HighlightProvider({ children }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(() => new Map())
  const [queued, setQueued] = useState(EMPTY)        // the queue's highlight entries (saved here, not landed yet)
  const [adds, setAdds] = useState([])
  const [deletes, setDeletes] = useState(() => new Set())
  const [edits, setEdits] = useState(() => new Map())
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [status, setStatus] = useState('idle')     // idle | error (Save only hands work to the queue, so there is no 'saving' phase)
  const [error, setError] = useState(null)
  const loading = useRef(false)
  const landedWhileLoading = useRef([])

  // The queue is the source of truth for work that has been saved but not landed.
  // Only highlight entries matter here, and only their identity / colour: a status tick or a flag
  // landing must not re-render every highlighted answer on screen.
  const sig = useRef('')
  useEffect(() => subscribeQueue(snap => {
    const items = snap.items.filter(i => i.hl)
    const next = items.map(i => `${i.key}|${i.kind}|${i.hl.color}`).join(',')
    if (next === sig.current) return
    sig.current = next
    setQueued(items.length ? items : EMPTY)
  }), [])

  // A landed change joins the saved set. One that lands while the first fetch is
  // still in flight is replayed on top of it, so the fetch cannot erase it.
  useEffect(() => onHighlightLanded((kind, hl) => {
    if (loading.current) landedWhileLoading.current.push([kind, hl])
    setSaved(prev => fold(prev, kind, hl))
  }), [])

  // Load saved highlights + any unsaved work left from a previous visit.
  useEffect(() => {
    if (!user) { setSaved(new Map()); setAdds([]); setDeletes(new Set()); setEdits(new Map()); return }
    const p = loadPending(user.id)
    if (p) { setAdds(p.adds); setDeletes(p.deletes); setEdits(p.edits) }
    let cancelled = false
    loading.current = true
    landedWhileLoading.current = []
    fetchHighlights()
      .then(m => {
        if (cancelled) return
        let merged = m
        for (const [kind, hl] of landedWhileLoading.current) merged = fold(merged, kind, hl)
        setSaved(merged)
      })
      .catch(e => { if (!cancelled) console.error('[highlights] load failed:', e.message) })
      .finally(() => { if (!cancelled) loading.current = false })
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

  // `settled`: saved rows with the queue's unsent work applied (removes, recolours, adds).
  const settled = useMemo(() => {
    const dels = new Set(), recolours = new Map(), qAdds = []
    for (const p of queued) {
      if (p.kind === 'hl_del') dels.add(p.hl.id)
      else if (p.kind === 'hl_color') recolours.set(p.hl.id, p.hl.color)
      else if (p.kind === 'hl_add') qAdds.push(p.hl)
    }
    const out = new Map()
    for (const [uid, list] of saved) {
      const kept = list
        .filter(h => !dels.has(h.id))
        .map(h => recolours.has(h.id) ? { ...h, color: recolours.get(h.id) } : h)
      if (kept.length) out.set(uid, kept)
    }
    for (const a of qAdds) {
      const list = out.get(a.uid) || []
      if (!list.some(h => h.id === a.id)) out.set(a.uid, [...list, recolours.has(a.id) ? { ...a, color: recolours.get(a.id) } : a])
    }
    return out
  }, [saved, queued])

  // What the renderer sees: settled rows minus unsaved deletes, unsaved colour
  // edits applied, plus unsaved adds.
  const byUid = useMemo(() => {
    const out = new Map()
    for (const [uid, list] of settled) {
      const kept = list
        .filter(h => !deletes.has(h.id))
        .map(h => edits.has(h.id) ? { ...h, color: edits.get(h.id) } : h)
      if (kept.length) out.set(uid, kept)
    }
    for (const a of adds) {
      const list = out.get(a.uid) || []
      out.set(a.uid, [...list, a])
    }
    return out
  }, [settled, adds, deletes, edits])

  const getFor = useCallback((uid) => byUid.get(uid) || EMPTY, [byUid])
  // Lookup in the SETTLED set (what the server has or is about to have), for the sync drawer's Undo.
  const find = useCallback((id) => findIn(settled, id), [settled])

  const add = useCallback((uid, anchors, c) => {
    if (!uid || !anchors?.length) return
    const chosen = c || color
    setAdds(list => [...list, ...anchors.map(a => ({ ...a, uid, color: chosen, id: newId() }))])
  }, [color])

  // Unsaved adds are changed in `adds` itself; deletes and edits only ever name rows that already exist.
  const remove = useCallback((uid, ids) => {
    if (!ids?.length) return
    const local = new Set(adds.map(a => a.id))
    const existing = ids.filter(id => !local.has(id))
    const gone = new Set(ids)
    setAdds(list => list.filter(a => !gone.has(a.id)))        // unsaved ones just vanish
    if (!existing.length) return
    setDeletes(d => { const n = new Set(d); for (const id of existing) n.add(id); return n })
    setEdits(e => {                                            // an edit on a deleted row is moot
      if (!existing.some(id => e.has(id))) return e
      const n = new Map(e); for (const id of existing) n.delete(id); return n
    })
  }, [adds])

  const recolor = useCallback((uid, ids, c) => {
    if (!ids?.length || !c) return
    const local = new Set(adds.map(a => a.id))
    const set = new Set(ids)
    setAdds(list => list.map(a => set.has(a.id) ? { ...a, color: c } : a))
    const existing = ids.filter(id => !local.has(id))
    if (!existing.length) return
    setEdits(e => {
      const n = new Map(e)
      for (const id of existing) n.set(id, c)
      return n
    })
  }, [adds])

  // Save: hand the unsaved sets to the offline queue, then clear them. Enqueueing is
  // synchronous and happens before the clear, so every row stays on screen throughout.
  const save = useCallback(async () => {
    if (!user || !dirtyCount) return false
    // The queue is keyed to the signed-in user; if it is not ready the changes would be dropped, so keep them pending instead.
    if (!highlightQueueReady()) { setError('Not ready to save yet — try again in a moment'); setStatus('error'); return false }
    setError(null); setStatus('idle')
    for (const a of adds) enqueueHighlightAdd(isTmp(a.id) ? { ...a, id: newId() } : a)
    for (const id of deletes) {
      const h = findIn(settled, id)
      if (h) enqueueHighlightRemove(h)
    }
    for (const [id, c] of edits) {
      if (deletes.has(id)) continue
      const h = findIn(settled, id)
      if (h && h.color !== c) enqueueHighlightColor({ ...h, color: c }, h.color)
    }
    setAdds([]); setDeletes(new Set()); setEdits(new Map())
    return true
  }, [user, adds, deletes, edits, settled, dirtyCount])

  const discard = useCallback(() => {
    setAdds([]); setDeletes(new Set()); setEdits(new Map()); setError(null); setStatus('idle')
  }, [])

  // The sync drawer's Undo acts on SAVED changes, so it goes straight to the queue (no Save step).
  const queueRemove = useCallback((hl) => { if (user && hl) enqueueHighlightRemove(hl) }, [user])
  const queueRestore = useCallback((hl) => { if (user && hl) enqueueHighlightAdd(hl) }, [user])
  const queueRecolor = useCallback((hl, prev) => { if (user && hl && prev) enqueueHighlightColor({ ...hl, color: prev }, hl.color) }, [user])

  const value = {
    getFor, find, add, remove, recolor, save, discard,
    queueRemove, queueRestore, queueRecolor,
    color, setColor,
    dirtyCount, status, error,
    canHighlight: Boolean(user),
  }
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>
}

export function useHighlights() {
  return useContext(HighlightContext) || {
    getFor: () => EMPTY, find: () => null, add: () => {}, remove: () => {}, recolor: () => {},
    save: async () => false, discard: () => {},
    queueRemove: () => {}, queueRestore: () => {}, queueRecolor: () => {},
    color: DEFAULT_COLOR, setColor: () => {},
    dirtyCount: 0, status: 'idle', error: null, canHighlight: false,
  }
}
