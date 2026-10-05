// Offline-tolerant write queue for nail / important / weak / delete, for the
// Recycle Bin's restore / delete-forever, and for text highlights.
//
// Every one of those actions is optimistic in the UI and flows through here. (Highlights
// are the one exception to "at once": they stay local until the user presses Save, which
// is what enqueues them — see contexts/HighlightContext.jsx. From then on they behave
// like everything else here.)
// Flag writes are coalesced per question uid on a LAST-ACTION-WINS basis: if you
// nail then un-nail then mark important the same question while offline, only the
// final state per column is kept ({ nailed:false, important:true }). A delete, a
// restore and a delete-forever all decide whether one question is in the bin, so
// they share one entry per question and the latest decision replaces the earlier.
// A highlight is one entry per highlight (its uuid is minted by the client): adding
// then removing it before it was sent sends nothing, a recolour of an unsent add
// just edits that add, and an insert is an upsert so a retry never duplicates a row.
// A debounced flusher drains the queue: flags go out as one bulk upsert, deletes as
// one RPC each, highlights as one batch per kind, and a failure in one group cannot
// block the others.
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
import { trashQuestion, restoreQuestion, purgeQuestion } from './trashSync.js'
import { upsertHighlights, deleteHighlights, recolorHighlights } from './highlightSync.js'
import { labelFor, textOf } from './questionLabels.js'

const LS_KEY = (uid) => `ict_pq_${uid}`
const DEBOUNCE_MS = 400
// backoff schedule for server-reachable-but-failing; last value repeats.
const BACKOFF_MS = [4000, 12000, 30000, 60000, 300000]
const DONE_CAP = 50
// Server call for each non-flag kind. A kind missing here is never sent.
const RUN = { delete: trashQuestion, restore: restoreQuestion, purge: purgeQuestion }
const trashKey = (id) => `trash:${id}`
// A highlight's add / remove share one entry (the latest decision wins); its colour change is separate, so a
// recolour can queue behind an add that is already in flight.
const hlKey = (id) => `hl:${id}`
const hlColorKey = (id) => `hlc:${id}`
const isHl = (kind) => kind === 'hl_add' || kind === 'hl_del' || kind === 'hl_color'

// The loader module a question lives in: its _module where the loader sets one,
// otherwise the uid's prefix, since uids are module-scoped.
function moduleOf(q, uid) {
  if (q?._module) return q._module
  const i = uid ? uid.indexOf(':') : -1
  return i > 0 ? uid.slice(0, i) : null
}

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
const restoredListeners = new Set()
const highlightListeners = new Set()

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
    key: e.key, kind: e.kind, uid: e.uid, id: e.id, module: e.module, patch: e.patch,
    hl: e.hl, prev: e.prev,
    // A highlight row is named by its quote, not by the question it sits in.
    label: e.label || (isHl(e.kind) ? '' : meta?.text) || '', cat: e.cat || meta?.cat || '',
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
        key: e.key, kind: e.kind, uid: e.uid, id: e.id, module: e.module, patch: e.patch,
        hl: e.hl, prev: e.prev, label: e.label, cat: e.cat, at: e.at, attempts: e.attempts,
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
      // Older builds kept a delete as del:<id> and a bin action as bin:<id>. Both
      // are now the one trash:<id> entry, so the later decision replaces the earlier.
      const key = /^(del|bin):/.test(row.key) && row.id ? trashKey(row.id) : row.key
      map.delete(key)
      map.set(key, makeEntry({ ...row, key }))
    }
  }
  return map
}

function makeEntry(e) {
  return {
    key: e.key, kind: e.kind, uid: e.uid || null, id: e.id || null,
    module: e.module || null,
    patch: e.patch || null,
    hl: e.hl || null, prev: e.prev || null,
    label: e.label || '', cat: e.cat || '',
    at: e.at || Date.now(), attempts: e.attempts || 0,
    sending: false, err: null, syncedAt: null,
  }
}

function patchEq(a, b) {
  return a?.nailed === b?.nailed && a?.important === b?.important && a?.weak === b?.weak && a?.note === b?.note
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

// Record one flag change. `patch` holds the columns one action changed, from
// { nailed, important, weak } — e.g. { weak:true, important:true }.
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
  const key = trashKey(q._id)
  if (pending.get(key)?.kind === 'delete') return
  const uid = q.uid || q._uid || null
  pending.set(key, makeEntry({
    key, kind: 'delete', id: q._id, uid, module: moduleOf(q, uid),
    label: textOf(q) || labelFor(uid)?.text || '',
    cat: q._catName || q._slug || labelFor(uid)?.cat || '',
  }))
  afterEnqueue()
}

// Record a Recycle Bin action. Keyed per question so the latest decision wins:
// restore then delete-forever while offline sends only the delete-forever.
export function enqueueBinAction(q, action) {
  if (!userId || !q?._id || (action !== 'restore' && action !== 'purge')) return
  const key = trashKey(q._id)
  const uid = q.uid || q._uid || null
  pending.set(key, makeEntry({
    ...(pending.get(key) || {}),
    key, kind: action, id: q._id, uid, module: moduleOf(q, uid),
    label: textOf(q) || labelFor(uid)?.text || '',
    cat: q._catName || q._slug || labelFor(uid)?.cat || '',
    at: Date.now(),
  }))
  afterEnqueue()
}

// What a highlight row says about itself: its quote, and the section it sits in.
function hlMeta(hl) {
  const q = String(hl.quote || '').replace(/\s+/g, ' ').trim()
  const section = hl.uid?.startsWith('equation:') ? 'Equation' : labelFor(hl.uid)?.cat || ''
  return { label: q ? `“${q.length > 90 ? `${q.slice(0, 89)}…` : q}”` : 'Highlight', cat: section }
}

function hlEntry(key, kind, hl, extra) {
  return makeEntry({ key, kind, uid: hl.uid, hl: { ...hl }, ...hlMeta(hl), ...extra })
}

// A new highlight (`hl` carries its uuid). Re-adding one whose removal has not
// been sent yet just cancels the removal: the row is still on the server.
// Whether highlight changes can be queued yet (the queue is keyed to the signed-in user). Save checks this first, so it never
// clears pending highlights that the queue would then silently ignore.
export function highlightQueueReady() { return Boolean(userId) }

export function enqueueHighlightAdd(hl) {
  if (!userId || !hl?.id) return
  const key = hlKey(hl.id)
  const cur = pending.get(key)
  if (cur?.kind === 'hl_del' && !cur.sending) pending.delete(key)
  else pending.set(key, hlEntry(key, 'hl_add', hl))
  afterEnqueue()
}

// A removed highlight. `hl` is the full row, so the drawer can name it and undo can put it back.
export function enqueueHighlightRemove(hl) {
  if (!userId || !hl?.id) return
  const key = hlKey(hl.id)
  const cur = pending.get(key)
  pending.delete(hlColorKey(hl.id))              // a colour change on a row that is going away is moot
  if (cur?.kind === 'hl_add' && !cur.sending) pending.delete(key)   // never sent: nothing to undo on the server
  else pending.set(key, hlEntry(key, 'hl_del', hl))
  afterEnqueue()
}

// A recolour; `hl` already carries the NEW colour and `prev` is the colour before it.
export function enqueueHighlightColor(hl, prev) {
  if (!userId || !hl?.id) return
  const addKey = hlKey(hl.id)
  const add = pending.get(addKey)
  if (add?.kind === 'hl_add' && !add.sending) {
    pending.set(addKey, hlEntry(addKey, 'hl_add', hl, { at: add.at }))   // fold into the unsent add
  } else {
    const key = hlColorKey(hl.id)
    const cur = pending.get(key)
    const was = cur && !cur.sending ? cur.prev : prev   // undo goes back to the colour before the whole run
    pending.set(key, hlEntry(key, 'hl_color', hl, { prev: was, at: cur?.at }))
  }
  afterEnqueue()
}

// Fired once a highlight change has reached the server, so whoever mirrors the saved set can fold it in.
export function onHighlightLanded(fn) {
  highlightListeners.add(fn)
  return () => highlightListeners.delete(fn)
}

// Ids whose Recycle Bin action has not landed yet. The bin re-reads the server,
// which still lists them, so it hides these rather than offering them twice.
export function pendingBinIds() {
  const ids = new Set()
  for (const e of pending.values()) if (e.kind === 'restore' || e.kind === 'purge') ids.add(e.id)
  return ids
}

// A restored question only reappears once the server has it, so whoever loads
// its module is told when the restore LANDS, not when it was queued.
export function onRestoreLanded(fn) {
  restoredListeners.add(fn)
  return () => restoredListeners.delete(fn)
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
function settle(entry, sent) {
  const cur = pending.get(entry.key)
  if (!cur) return false
  if (cur.kind === 'flag' && !patchEq(cur.patch, sent)) {
    cur.sending = false
    return false
  }
  // Recoloured again while the first colour was in flight: the newer one still has to go out.
  if (cur.kind === 'hl_color' && cur.hl.color !== sent) {
    cur.sending = false
    return false
  }
  // A Recycle Bin decision changed mid-flight (restore became delete-forever):
  // the newer one still has to go out.
  if (cur.kind !== 'flag' && cur.kind !== entry.kind) {
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
  const sent = new Map(batch.map((e) => [e.key, e.kind === 'hl_color' ? e.hl.color : e.patch ? { ...e.patch } : null]))
  batch.forEach((e) => { e.sending = true })
  emit()

  const flags = batch.filter((e) => e.kind === 'flag')
  // Deletes and Recycle Bin actions, replayed in the order they were made.
  const ops = batch.filter((e) => RUN[e.kind])
  const restored = []
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

  // Sequential, and independent of each other: one rejected write (already
  // gone, permission changed) must not strand the rest of the queue.
  for (const d of ops) {
    try {
      await RUN[d.kind](d.id)
      if (settle(d)) {
        landed++
        if (d.kind === 'restore' && d.module) restored.push(d.module)
      }
    } catch (e) {
      failed = true
      fail(d, e)
    }
  }

  // Highlights, one batch per kind, in the order that keeps a row consistent (insert, then remove, then recolour).
  const hlGroups = [
    ['hl_add', (list) => upsertHighlights(userId, list.map((e) => e.hl))],
    ['hl_del', (list) => deleteHighlights(list.map((e) => e.hl.id))],
    ['hl_color', (list) => recolorHighlights(list.map((e) => [e.hl.id, e.hl.color]))],
  ]
  for (const [kind, run] of hlGroups) {
    const list = batch.filter((e) => e.kind === kind)
    if (!list.length) continue
    try {
      await run(list)
      for (const e of list) {
        if (settle(e, sent.get(e.key))) {
          landed++
          highlightListeners.forEach((fn) => fn(e.kind, e.hl))
        }
      }
    } catch (err) {
      failed = true
      for (const e of list) fail(e, err)
    }
  }

  inFlight = false
  persist()
  if (landed) lastSavedAt = Date.now()
  if (restored.length) {
    const modules = [...new Set(restored)]
    restoredListeners.forEach((fn) => fn(modules))
  }

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
