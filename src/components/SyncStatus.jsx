import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Check, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { subscribeQueue } from '../lib/offlineQueue.js'
import { getToastRail } from '../lib/toastRail.js'

// Top-right pill driven by the offline write queue, and the doorway into the
// sync drawer.
//   • Nothing at all while the queue is empty — reading and quizzing stay clean.
//   • A ticker while changes are stuck (offline, or the server is unreachable).
//   • One transient toast when a queued backlog is recovered.
// Both are tappable: they open the drawer, where each queued change can be
// followed until it lands.
//
// A normal online write flushes in well under a second, so the ticker waits out
// a grace period before appearing — otherwise every tap would flash a chip. The
// wait is skipped once the queue is known to be stuck, which is the case worth
// seeing immediately.

const GRACE_MS = 1200

let toastId = 0

export default function SyncStatus({ onOpen }) {
  const [snap, setSnap] = useState({ pendingCount: 0, status: 'idle', offline: false, items: [] })
  const [toasts, setToasts] = useState([])
  const [ripe, setRipe] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    const unsub = subscribeQueue((s, signal) => {
      setSnap(s)
      if (signal?.savedToast > 0) {
        const id = ++toastId
        const n = signal.savedToast
        setToasts((t) => [...t, { id, n }])
        const timer = setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
        timers.current.push(timer)
      }
    })
    const pending = timers.current
    return () => {
      unsub()
      pending.forEach(clearTimeout)
    }
  }, [])

  // Keyed on the boolean, not the count, so a burst of changes doesn't keep
  // restarting the grace timer.
  const has = snap.pendingCount > 0
  useEffect(() => {
    if (!has) return
    const t = setTimeout(() => setRipe(true), GRACE_MS)
    return () => { clearTimeout(t); setRipe(false) }
  }, [has])

  const stuck = snap.status === 'queued'
  const failed = snap.items?.some((i) => i.state === 'failed')
  const showTicker = has && (ripe || stuck)
  if (!showTicker && toasts.length === 0) return null

  const Icon = snap.offline ? CloudOff : failed ? AlertTriangle : RefreshCw
  const label = snap.offline ? 'Offline' : failed ? 'Retrying' : stuck ? 'Reconnecting' : 'Saving'

  return createPortal(
    <div className="sync-status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} className="sync-chip sync-chip-ok" onClick={onOpen} title="Open sync queue">
          <Check size={13} />
          <span>{t.n} change{t.n > 1 ? 's' : ''} saved</span>
        </button>
      ))}
      {showTicker && (
        <button
          className={`sync-chip sync-chip-wait${failed ? ' sync-chip-bad' : ''}`}
          onClick={onOpen}
          title="Open sync queue"
        >
          <Icon size={13} className={!snap.offline && !failed ? 'sync-spin' : undefined} />
          <span>{label} · {snap.pendingCount} queued</span>
        </button>
      )}
    </div>,
    getToastRail()
  )
}

// The pill only exists while something is queued, and the top nav is hidden in
// quiz / study / written — so this button is the way back into the drawer once
// everything has landed and you want to check what did.
export function SyncButton({ className = 'theme-toggle-nav', onClick }) {
  const [snap, setSnap] = useState({ pendingCount: 0, offline: false })
  useEffect(() => subscribeQueue((s) => setSnap(s)), [])
  return (
    <button className={`${className} sync-btn`} onClick={onClick} title="Sync queue">
      {snap.offline ? <CloudOff size={17} /> : <Cloud size={17} />}
      {snap.pendingCount > 0 && (
        <span className="sync-btn-dot">{snap.pendingCount > 9 ? '9+' : snap.pendingCount}</span>
      )}
    </button>
  )
}
