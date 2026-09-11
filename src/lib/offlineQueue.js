// Offline-tolerant write queue for nail / important / delete.
//
// Every one of those actions is optimistic in the UI and flows through here.
// Flag writes are coalesced per question uid on a LAST-ACTION-WINS basis: if you
// nail then un-nail then mark important the same question while offline, only the
// final state per column is kept ({ nailed:false, important:true }). Deletes get
// their own entry per question, since they hit a different endpoint. A debounced
// flusher drains the queue: flags go out as one bulk upsert, deletes as one RPC
// each, and a failure in either group cannot block the other.
//
// Failure handling is deliberately un-aggressive:
//   • offline (navigator.onLine === false) → do NOT poll; wait for the `online`
//     event (and tab-visible) to retry.
//   • online but the server rejects/times out → exponential backoff, capped, so
//     we don't hammer a struggling server.
//   • the pending map is mirrored to localStorage per user, so unsynced changes
//     survive a reload / logout and flush on the next visit.
//
// Subscribers get a snapshot of the whole queue — the pending entries, the
// entries that synced this session, and enough state to explain what the queue
// is doing right now — plus one-shot side-signals: { saved } when a flush lands
// (drives the "last saved" time) and { savedToast:N } when a flush RECOVERS a
// backlog the user was told about (drives the "N changes saved" toast). Silent
// success (online, first try) emits no toast — the common case never clutters.
//
// The synced list is session-only by design: it exists so you can watch a
// backlog actually land after a reconnect, not as a permanent audit log.

import { bulkUpsert } from './progressSync.js'
import { trashQuestion } from './trashSync.js'
import { labelFor, textOf } from './questionLabels.js'

const LS_KEY = (uid) => `ict_pq_${uid}`
const DEBOUNCE_MS = 400
// backoff schedule for server-reachable-but-failing; last value repeats.
const BACKOFF_MS = [4000, 12000, 30000, 60000, 300000]
const DONE_CAP = 50

let userId = null
let pending = new Map()           // key -> entry (see makeEntry)
let done = []                     // synced this session, newest first
let status = 'idle'               // 'idle' | 'saving' | 'queued'
let notified = false              // has the user been shown a "queued" notice?
let inFlight = false
let flushTimer = null            // null ⇒ no flush pending (used by the heartbeat to detect a dead chain)
let backoffIdx = 0
let nextRetryAt = 0              // 0 ⇒ not in backoff
let lastError = null
let lastSavedAt = null

const subscribers = new Set()

function online() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

// What the UI shows per row. `sending` and `err` are transient, so they are
// stripped before persisting.
function view(e) {
  // Fall back to the registry at read time: an entry queued before its module
  // finished loading (or carried over from an older build) has no stored label,
  // and by the time the drawer is open the content usually has landed.
  const meta = (!e.label || !e.cat) && e.uid ? labelFor(e.uid) : null
  return {
    key: e.key, kind: e.kind, uid: e.uid, patch: e.patch,
    label: e.label || meta?.text || '', cat: e.cat || meta?.cat || '',
    at: e.at, attempts: e.attempts,
    err: e.err, syncedAt: e.syncedAt,
    state: e.syncedAt ? 'synced' : e.sending ? 'sending' : e.err ? 'failed' : 'queued',
  }
}

function snapshot() {
  return {
    pendingCount: pending.size,
    status,
    offline: !online(),
    items: [...pending.values()].map(view),
    done: done.map(view),
    lastError,
    nextRetryAt,
    lastSavedAt,
  }
}

function emit(signal) {
  const snap = snapshot()
  subscribers.forEach((fn) => fn(snap, signal))
}

function persist() {
  if (!userId) return
  try {
    if (pending.size) {
      // Only the durable fields — `sending` / `err` / `syncedAt` describe one attempt.
      const rows = [...pending.values()].map((e) => ({
        key: e.key, kind: e.kind, uid: e.uid, id: e.id, patch: e.patch,
        label: e.label, cat: e.cat, at: e.at, attempts: e.attempts,
      }))
      localStorage.setItem(LS_KEY(userId), JSON.stringify(rows))
    } else {
      localStorage.removeItem(LS_KEY(userId))
    }
  } catch { /* private mode / quota — in-memory queue still works this session */ }
}

// Accepts both the current shape (array of entries) and the pre-drawer shape
// (array of [uid, patch] pairs), so an upgrade never drops a queued change.
function restore(raw) {
  const map = new Map()
  let parsed
  try { parsed = JSON.parse(raw) } catch { return map }
  if (!Array.isArray(parsed)) return map
  for (const row of parsed) {
    if (Array.isArray(row)) {
      const [uid, patch] = row
      if (uid && patch) map.set(uid, makeEntry({ key: uid, kind: 'flag', uid, patch }))
    } else if (row?.key) {
      map.set(row.key, makeEntry(row))
    }
  }
  return map
}

function makeEntry(e) {
  return {
    key: e.key, kind: e.kind, uid: e.uid || null, id: e.id || null,
    patch: e.patch || null,
    label: e.label || '', cat: e.cat || '',
    at: e.at || Date.now(), attempts: e.attempts || 0,
    sending: false, err: null, syncedAt: null,
  }
}

function patchEq(a, b) {
  return a?.nailed === b?.nailed && a?.important === b?.important
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
  nextRetryAt = 0
  lastError = null
  userId = uid || null
  pending = new Map()
  done = []
  notified = false
  if (userId) {
    try {
      const raw = localStorage.getItem(LS_KEY(userId))
      if (raw) pending = restore(raw)
    } catch { /* ignore corrupt cache */ }
  }
  status = pending.size ? 'queued' : 'idle'
  if (pending.size) notified = true   // a restored backlog stays visible until it lands
  emit()
  if (pending.size) scheduleFlush(0)
}

// Record one flag change. `patch` is { nailed?:bool } or { important?:bool }.
// The readable label comes from the content loader's registry — the caller only
// has a uid, and a uid is a one-way hash of the question text.
export function enqueue(uid, patch) {
  if (!userId || !uid || !patch) return
  const cur = pending.get(uid)
  const meta = labelFor(uid)
  pending.set(uid, makeEntry({
    ...(cur || {}),
    key: uid,
    kind: 'flag',
    uid,
    patch: { ...(cur?.patch || {}), ...patch },   // last-action-wins per column
    label: cur?.label || meta?.text || '',
    cat: cur?.cat || meta?.cat || '',
    at: cur?.at || Date.now(),
  }))
  afterEnqueue()
}

// Record one delete. Takes the question object because the row id and the label
// both live on it, and a deleted question can no longer be looked up.
export function enqueueDelete(q) {
  if (!userId || !q?._id) return
  const key = `del:${q._id}`
  if (pending.has(key)) return
  const uid = q.uid || q._uid || null
  pending.set(key, makeEntry({
    key, kind: 'delete', id: q._id, uid,
    label: textOf(q) || labelFor(uid)?.text || '',
    cat: q._catName || q._slug || labelFor(uid)?.cat || '',
  }))
  afterEnqueue()
}

function afterEnqueue() {
  persist()
  if (!online()) {
    markQueued()          // reflect offline immediately, no doomed request
  } else {
    if (status === 'idle') status = 'saving'
    emit()
    scheduleFlush(DEBOUNCE_MS)
  }
}

// Manual retry from the sync drawer: clear the per-entry errors and the backoff
// so the next attempt happens now instead of at the end of the schedule.
export function flushNow() {
  if (!userId || !pending.size) return
  backoffIdx = 0
  nextRetryAt = 0
  lastError = null
  pending.forEach((e) => { e.err = null })
  emit()
  scheduleFlush(0)
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
  nextRetryAt = Date.now() + delay
  scheduleFlush(delay)
}

// One entry landed. A flag whose value changed mid-flight stays queued so the
// newer value is written on the next pass.
function settle(entry, sentPatch) {
  const cur = pending.get(entry.key)
  if (!cur) return false
  if (cur.kind === 'flag' && !patchEq(cur.patch, sentPatch)) {
    cur.sending = false
    return false
  }
  pending.delete(cur.key)
  cur.sending = false
  cur.err = null
  cur.syncedAt = Date.now()
  done.unshift(cur)
  if (done.length > DONE_CAP) done.length = DONE_CAP
  return true
}

function fail(entry, e) {
  const cur = pending.get(entry.key)
  if (!cur) return
  cur.sending = false
  cur.attempts++
  cur.err = e?.message || 'Save failed'
  lastError = cur.err
}

async function flush() {
  if (inFlight || !userId || !pending.size) return
  if (!online()) { markQueued(); return }

  inFlight = true
  status = 'saving'
  nextRetryAt = 0
  lastError = null

  // Snapshot the exact patches we're sending; anything the user changes mid-flight
  // stays queued and flushes on the next pass.
  const batch = [...pending.values()]
  const sent = new Map(batch.map((e) => [e.key, e.patch ? { ...e.patch } : null]))
  batch.forEach((e) => { e.sending = true })
  emit()

  const flags = batch.filter((e) => e.kind === 'flag')
  const deletes = batch.filter((e) => e.kind === 'delete')
  let landed = 0
  let failed = false

  if (flags.length) {
    try {
      await bulkUpsert(userId, flags.map((e) => ({ uid: e.uid, patch: e.patch })))
      for (const e of flags) if (settle(e, sent.get(e.key))) landed++
    } catch (e) {
      failed = true
      for (const f of flags) fail(f, e)
    }
  }

  // Sequential, and independent of each other: one rejected delete (already
  // gone, permission changed) must not strand the rest of the queue.
  for (const d of deletes) {
    try {
      await trashQuestion(d.id)
      if (settle(d)) landed++
    } catch (e) {
      failed = true
      fail(d, e)
    }
  }

  inFlight = false
  persist()
  if (landed) lastSavedAt = Date.now()

  if (!pending.size) {
    const recovered = notified
    status = 'idle'
    notified = false
    backoffIdx = 0
    emit({ saved: true, savedToast: recovered ? landed : 0 })
    return
  }

  if (failed) {
    markQueued()
    scheduleBackoff()
  } else {
    // Only newer writes are left (they arrived mid-flight) — go again promptly.
    backoffIdx = 0
    status = 'saving'
    emit(landed ? { saved: true } : undefined)
    scheduleFlush(DEBOUNCE_MS)
  }
}

// Wake up on connectivity / tab focus. Registered once at module load.
if (typeof window !== 'undefined') {
  const wake = () => {
    emit()   // refresh the offline/online label promptly
    if (!userId || !pending.size || !online()) return
    backoffIdx = 0
    nextRetryAt = 0
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
