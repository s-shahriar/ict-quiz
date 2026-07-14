// Offline-tolerant write queue for nail/important flags.
//
// Every flag change is optimistic in the UI and flows through here. Writes are
// coalesced per question uid on a LAST-ACTION-WINS basis: if you nail then
// un-nail then mark important the same question while offline, only the final
// state per column is kept ({ nailed:false, important:true }). A debounced
// flusher drains the queue to Supabase in one bulk upsert.
//
// Failure handling is deliberately un-aggressive:
//   • offline (navigator.onLine === false) → do NOT poll; wait for the `online`
//     event (and tab-visible) to retry.
//   • online but the server rejects/times out → exponential backoff, capped, so
//     we don't hammer a struggling server.
//   • the pending map is mirrored to localStorage per user, so unsynced changes
//     survive a reload / logout and flush on the next visit.
//
// Subscribers get a snapshot { pendingCount, status, offline } plus one-shot
// side-signals: { saved } when a flush lands (drives the "last saved" time) and
// { savedToast:N } when a flush RECOVERS a backlog the user was told about
// (drives the "N changes saved" toast). Silent success (online, first try) emits
// no toast — the common case never clutters the screen.

import { bulkUpsert } from './progressSync.js'

const LS_KEY = (uid) => `ict_pq_${uid}`
const DEBOUNCE_MS = 400
// backoff schedule for server-reachable-but-failing; last value repeats.
const BACKOFF_MS = [4000, 12000, 30000, 60000, 300000]

let userId = null
let pending = new Map()           // uid -> { nailed?, important? }
let status = 'idle'               // 'idle' | 'saving' | 'queued'
let notified = false              // has the user been shown a "queued" notice?
let inFlight = false
let flushTimer = null            // null ⇒ no flush pending (used by the heartbeat to detect a dead chain)
let backoffIdx = 0

const subscribers = new Set()

function online() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

function snapshot() {
  return { pendingCount: pending.size, status, offline: !online() }
}

function emit(signal) {
  const snap = snapshot()
  subscribers.forEach((fn) => fn(snap, signal))
}

function persist() {
  if (!userId) return
  try {
    if (pending.size) localStorage.setItem(LS_KEY(userId), JSON.stringify([...pending]))
    else localStorage.removeItem(LS_KEY(userId))
  } catch { /* private mode / quota — in-memory queue still works this session */ }
}

function patchEq(a, b) {
  return a.nailed === b.nailed && a.important === b.important
}

export function subscribeQueue(fn) {
  subscribers.add(fn)
  fn(snapshot())
  return () => subscribers.delete(fn)
}

// Point the queue at the signed-in user (or null on logout). Loads any persisted
// backlog for that user and kicks off a flush. Logout keeps the user's
// localStorage backlog intact for their next visit.
export function setQueueUser(uid) {
  if (userId === uid) return
  clearTimeout(flushTimer)
  flushTimer = null
  inFlight = false
  backoffIdx = 0
  userId = uid || null
  pending = new Map()
  notified = false
  if (userId) {
    try {
      const raw = localStorage.getItem(LS_KEY(userId))
      if (raw) pending = new Map(JSON.parse(raw))
    } catch { /* ignore corrupt cache */ }
  }
  status = pending.size ? 'queued' : 'idle'
  if (pending.size) notified = true   // a restored backlog stays visible until it lands
  emit()
  if (pending.size) scheduleFlush(0)
}

// Record one flag change. `patch` is { nailed?:bool } or { important?:bool }.
export function enqueue(uid, patch) {
  if (!userId || !uid || !patch) return
  const cur = pending.get(uid) || {}
  pending.set(uid, { ...cur, ...patch })   // last-action-wins per column
  persist()
  if (!online()) {
    markQueued()          // reflect offline immediately, no doomed request
  } else {
    if (status === 'idle') status = 'saving'
    emit()
    scheduleFlush(DEBOUNCE_MS)
  }
}

function markQueued() {
  status = 'queued'
  notified = true
  emit()
}

function scheduleFlush(delay) {
  clearTimeout(flushTimer)
  flushTimer = setTimeout(() => { flushTimer = null; flush() }, delay)
}

function scheduleBackoff() {
  // Offline: don't burn retries — the `online` event (and the heartbeat) will
  // resume us. Online-but-failing: exponential backoff, capped, so we don't hammer.
  if (!online()) return
  const delay = BACKOFF_MS[Math.min(backoffIdx, BACKOFF_MS.length - 1)]
  backoffIdx++
  scheduleFlush(delay)
}

async function flush() {
  if (inFlight || !userId || !pending.size) return
  if (!online()) { markQueued(); return }

  inFlight = true
  status = 'saving'
  emit()

  // Snapshot the exact patches we're sending; anything the user changes mid-flight
  // stays queued and flushes on the next pass.
  const batch = [...pending.entries()].map(([uid, patch]) => ({ uid, patch }))

  try {
    await bulkUpsert(userId, batch)
    for (const { uid, patch } of batch) {
      const cur = pending.get(uid)
      if (cur && patchEq(cur, patch)) pending.delete(uid)
    }
    persist()
    inFlight = false
    backoffIdx = 0

    if (pending.size) {
      status = 'saving'
      emit()
      scheduleFlush(DEBOUNCE_MS)         // newer writes arrived during flight
    } else {
      const recovered = notified
      status = 'idle'
      notified = false
      emit({ saved: true, savedToast: recovered ? batch.length : 0 })
    }
  } catch {
    inFlight = false
    markQueued()
    scheduleBackoff()
  }
}

// Wake up on connectivity / tab focus. Registered once at module load.
if (typeof window !== 'undefined') {
  const wake = () => {
    emit()   // refresh the offline/online label promptly
    if (!userId || !pending.size || !online()) return
    backoffIdx = 0
    scheduleFlush(0)
  }
  window.addEventListener('online', wake)
  window.addEventListener('offline', () => { if (pending.size) markQueued() })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') wake()
  })

  // Safety net: a write can commit server-side yet surface to the client as a
  // failed fetch when connectivity flaps (e.g. toggling back online) — and a
  // backoff scheduled at that instant can die if navigator.onLine momentarily
  // read false. This heartbeat revives a stalled queue: it only acts when there
  // is queued work, we're online, nothing is in flight, and NO flush is already
  // scheduled (so it never disturbs an active backoff). Upserts are idempotent,
  // so a redundant retry is harmless.
  setInterval(() => {
    if (pending.size && online() && !inFlight && flushTimer === null) scheduleFlush(0)
  }, 15000)
}
