import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { TOPICS } from './index.js'
import { WRITTEN_DATA } from './written/index.js'
import { EXTRA_DATA } from './extra/index.js'
import { VIVA_DATA } from './viva/index.js'

// On-demand content: Q&A items live in Supabase and are fetched per module the
// first time that route needs them, then cached for the session and written
// into the bundled data structures in place. Each item gets its stable `_uid`
// attached (== the DB uid, == uidFor(module, text)) so components can nail/mark
// by `q._uid` without recomputing anything.

// Where each module's questions get written, keyed by category slug.
const STORE = {
  mcq: (slug) => TOPICS.find(t => t.id === slug),
  written: (slug) => WRITTEN_DATA[slug],
  extra: (slug) => EXTRA_DATA[slug],
  viva: (slug) => VIVA_DATA[slug],
}
export const CONTENT_MODULES = Object.keys(STORE)

const loaded = new Set()
const inflight = new Map()

export function isModuleLoaded(moduleId) { return loaded.has(moduleId) }

export function loadModule(moduleId) {
  if (!moduleId || loaded.has(moduleId)) return Promise.resolve()
  if (inflight.has(moduleId)) return inflight.get(moduleId)
  const getStore = STORE[moduleId]
  if (!getStore) return Promise.resolve()

  const p = (async () => {
    const bySlug = new Map()
    const pageSize = 1000
    // Paginate on the UNIQUE id — ordering by non-unique sort_order would
    // skip/duplicate rows across page boundaries once a module exceeds 1000
    // rows. Per-category newest-first order is applied in JS after grouping.
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('questions')
        .select('id, category_slug, uid, payload, sort_order')
        .eq('module', moduleId)
        .order('id')
        .range(from, from + pageSize - 1)
      if (error) throw error
      for (const r of data) {
        if (!bySlug.has(r.category_slug)) bySlug.set(r.category_slug, [])
        bySlug.get(r.category_slug).push({ ...r.payload, _uid: r.uid, _sort: r.sort_order })
      }
      if (data.length < pageSize) break
    }
    for (const [slug, items] of bySlug) {
      items.sort((a, b) => b._sort - a._sort)  // newest first
      const store = getStore(slug)
      if (store) store.questions = items
    }
    loaded.add(moduleId)
  })()
  inflight.set(moduleId, p)
  p.finally(() => inflight.delete(moduleId))
  return p
}

export function loadAllContent() {
  return Promise.all(CONTENT_MODULES.map(loadModule))
}

// Ensure a module's questions are loaded; re-render when ready.
export function useModuleReady(moduleId) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!moduleId || isModuleLoaded(moduleId)) return
    let cancelled = false
    loadModule(moduleId).then(() => { if (!cancelled) setTick(t => t + 1) }).catch(() => {})
    return () => { cancelled = true }
  }, [moduleId])
  return moduleId ? isModuleLoaded(moduleId) : true
}

// Ensure ALL modules are loaded (exam across modules, saved screens).
export function useAllContentReady() {
  const [ready, setReady] = useState(() => CONTENT_MODULES.every(isModuleLoaded))
  useEffect(() => {
    if (ready) return
    let cancelled = false
    loadAllContent().then(() => { if (!cancelled) setReady(true) }).catch(() => {})
    return () => { cancelled = true }
  }, [ready])
  return ready
}
