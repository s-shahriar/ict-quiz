import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloudOff, RefreshCw, Check } from 'lucide-react'
import { subscribeQueue } from '../lib/offlineQueue.js'
import { getToastRail } from '../lib/toastRail.js'

// Subtle, top-right sync indicator driven by the offline write queue.
//   • Persistent ticker while flag changes are stuck in the queue (offline or the
//     server is unreachable) — "Offline · N changes queued".
//   • One transient toast when a queued backlog is recovered — "N changes saved".
// Silent success (online, first try) shows nothing, so normal use never clutters.

let toastId = 0

export default function SyncStatus() {
  const [snap, setSnap] = useState({ pendingCount: 0, status: 'idle', offline: false })
  const [toasts, setToasts] = useState([])
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
    return () => {
      unsub()
      timers.current.forEach(clearTimeout)
    }
  }, [])

  const showTicker = snap.status === 'queued' && snap.pendingCount > 0
  if (!showTicker && toasts.length === 0) return null

  return createPortal(
    <div className="sync-status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="sync-chip sync-chip-ok">
          <Check size={13} />
          <span>{t.n} change{t.n > 1 ? 's' : ''} saved</span>
        </div>
      ))}
      {showTicker && (
        <div className="sync-chip sync-chip-wait" title="Changes are saved locally and will sync automatically">
          {snap.offline ? <CloudOff size={13} /> : <RefreshCw size={13} className="sync-spin" />}
          <span>
            {snap.offline ? 'Offline' : 'Reconnecting'} · {snap.pendingCount} change{snap.pendingCount > 1 ? 's' : ''} queued
          </span>
        </div>
      )}
    </div>,
    getToastRail()
  )
}
