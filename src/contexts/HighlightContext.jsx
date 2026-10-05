import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { fetchHighlights, DEFAULT_COLOR } from '../lib/highlightSync.js'
import {
  subscribeQueue, onHighlightLanded,
  enqueueHighlightAdd, enqueueHighlightRemove, enqueueHighlightColor,
} from '../lib/offlineQueue.js'

// PDF-style text highlights across the Written / Extra / Viva / Code answers and
// the Equation sheets.
//
// EDITING SAVES ITSELF. Highlighting, removing and recolouring update what is on
// screen at once and are handed to the offline write queue (lib/offlineQueue.js),
// the same one nail / important use: it sends them in the background, keeps them
// on this device while offline, retries, and lists them in the Sync queue drawer
// with an Undo. There is no Save button.
//
// What is rendered is `saved − pending removes + pending adds`, with pending
// recolours on top. `saved` is what the server has (fetched at login, and updated
// as queued changes land); the pending part is read straight from the queue's
// snapshot, so unsent work shows after a reload too, exactly as the queue restores it.
//
// Highlight ids are uuids minted here, so an add keeps its id from the first tap
// to the database row: nothing has to be swapped after the insert lands.

const HighlightContext = createContext(null)
const EMPTY = []
const LEGACY_KEY = (userId) => `ict_hl_pending_${userId}`

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`)

// Unsaved work left by the old Save-button flow. It is replayed into the queue
// once, after the saved set has loaded, then dropped.
function takeLegacyPending(userId) {
  try {
    const raw = localStorage.getItem(LEGACY_KEY(userId))
    if (!raw) return null
    localStorage.removeItem(LEGACY_KEY(userId))
    const p = JSON.parse(raw)
    return {
      adds: Array.isArray(p.adds) ? p.adds : [],
      deletes: Array.isArray(p.deletes) ? p.deletes : [],
      edits: Array.isArray(p.edits) ? p.edits : [],
    }
  } catch { return null }
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
  const [pending, setPending] = useState(EMPTY)      // the queue's highlight entries (anything not yet landed)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const loading = useRef(false)
  const landedWhileLoading = useRef([])

  // The queue is the source of truth for unsent highlight work.
  // Only highlight entries matter here, and only their identity / colour: a status tick or a flag
  // landing must not re-render every highlighted answer on screen.
  const sig = useRef('')
  useEffect(() => subscribeQueue(snap => {
    const items = snap.items.filter(i => i.hl)
    const next = items.map(i => `${i.key}|${i.kind}|${i.hl.color}`).join(',')
    if (next === sig.current) return
    sig.current = next
    setPending(items.length ? items : EMPTY)
  }), [])

  // A landed change joins the saved set. One that lands while the first fetch is
  // still in flight is replayed on top of it, so the fetch cannot erase it.
  useEffect(() => onHighlightLanded((kind, hl) => {
    if (loading.current) landedWhileLoading.current.push([kind, hl])
    setSaved(prev => fold(prev, kind, hl))
  }), [])

  // Load saved highlights; then replay anything the old Save flow left unsent.
  useEffect(() => {
    if (!user) { setSaved(new Map()); return }
    let cancelled = false
    loading.current = true
    landedWhileLoading.current = []
    fetchHighlights()
      .then(m => {
        if (cancelled) return
        let merged = m
        for (const [kind, hl] of landedWhileLoading.current) merged = fold(merged, kind, hl)
        setSaved(merged)
        const legacy = takeLegacyPending(user.id)
        if (!legacy) return
        for (const a of legacy.adds) enqueueHighlightAdd({ ...a, id: newId() })
        for (const id of legacy.deletes) { const h = findIn(merged, id); if (h) enqueueHighlightRemove(h) }
        for (const [id, c] of legacy.edits) { const h = findIn(merged, id); if (h) enqueueHighlightColor({ ...h, color: c }, h.color) }
      })
      .catch(e => { if (!cancelled) console.error('[highlights] load failed:', e.message) })
      .finally(() => { if (!cancelled) loading.current = false })
    return () => { cancelled = true }
  }, [user])

  // What the renderer sees: saved rows minus pending removes, pending recolours
  // applied, plus pending adds.
  const byUid = useMemo(() => {
    const dels = new Set(), recolours = new Map(), adds = []
    for (const p of pending) {
      if (p.kind === 'hl_del') dels.add(p.hl.id)
      else if (p.kind === 'hl_color') recolours.set(p.hl.id, p.hl.color)
      else if (p.kind === 'hl_add') adds.push(p.hl)
    }
    const out = new Map()
    for (const [uid, list] of saved) {
      const kept = list
        .filter(h => !dels.has(h.id))
        .map(h => recolours.has(h.id) ? { ...h, color: recolours.get(h.id) } : h)
      if (kept.length) out.set(uid, kept)
    }
    for (const a of adds) {
      const list = out.get(a.uid) || []
      if (!list.some(h => h.id === a.id)) out.set(a.uid, [...list, recolours.has(a.id) ? { ...a, color: recolours.get(a.id) } : a])
    }
    return out
  }, [saved, pending])

  const getFor = useCallback((uid) => byUid.get(uid) || EMPTY, [byUid])
  const find = useCallback((id) => findIn(byUid, id), [byUid])

  const add = useCallback((uid, anchors, c) => {
    if (!user || !uid || !anchors?.length) return
    const chosen = c || color
    for (const a of anchors) enqueueHighlightAdd({ ...a, uid, color: chosen, id: newId() })
  }, [user, color])

  const remove = useCallback((uid, ids) => {
    for (const id of ids || []) { const h = findIn(byUid, id); if (h) enqueueHighlightRemove(h) }
  }, [byUid])

  const recolor = useCallback((uid, ids, c) => {
    if (!ids?.length || !c) return
    for (const id of ids) {
      const h = findIn(byUid, id)
      if (h && h.color !== c) enqueueHighlightColor({ ...h, color: c }, h.color)
    }
  }, [byUid])

  // Put a removed highlight back (the sync drawer's Undo); it keeps its id.
  const restore = useCallback((hl) => { if (user && hl) enqueueHighlightAdd(hl) }, [user])

  const value = {
    getFor, find, add, remove, recolor, restore,
    color, setColor,
    canHighlight: Boolean(user),
  }
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>
}

export function useHighlights() {
  return useContext(HighlightContext) || {
    getFor: () => EMPTY, find: () => null, add: () => {}, remove: () => {}, recolor: () => {}, restore: () => {},
    color: DEFAULT_COLOR, setColor: () => {}, canHighlight: false,
  }
}
