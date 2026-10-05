import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Non-question content (Practice, Equation, ...) lives in the `content_blobs`
// table: one row per (kind, key), JSON in `payload`. Fetched once per kind per
// session; the same rows feed the Slate app, so there is a single copy.

const cache = new Map()     // kind -> [{ key, sort_order, payload }]
const inflight = new Map()

export function isBlobKindLoaded(kind) { return cache.has(kind) }

export function loadBlobs(kind) {
  if (cache.has(kind)) return Promise.resolve(cache.get(kind))
  if (inflight.has(kind)) return inflight.get(kind)
  const p = (async () => {
    const { data, error } = await supabase
      .from('content_blobs')
      .select('key,sort_order,payload')
      .eq('kind', kind)
      .order('sort_order')
    if (error) throw error
    cache.set(kind, data)
    return data
  })()
  inflight.set(kind, p)
  p.finally(() => inflight.delete(kind))
  return p
}

const applied = new Set()

// Ensure a kind is loaded AND applied (e.g. a module's store filled) before the
// caller renders from it. `apply(rows)` runs exactly once per kind; every
// component using the hook re-renders when that is done.
export function useBlobsReady(kind, apply) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (applied.has(kind)) return
    let cancelled = false
    loadBlobs(kind)
      .then(rows => {
        if (!applied.has(kind)) { apply?.(rows); applied.add(kind) }
        if (!cancelled) setTick(t => t + 1)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [kind])
  return applied.has(kind)
}
