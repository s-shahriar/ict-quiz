import { useEffect, useState } from 'react'
import { AlertTriangle, Bookmark, Check, Clock, Cloud, CloudOff, RefreshCw, Star, Trash2, X } from 'lucide-react'
import { subscribeQueue, flushNow } from '../lib/offlineQueue.js'

// Right-hand drawer that shows the offline write queue, built on the same shell
// as the category sidebar so it reads as part of the app rather than a debug panel.
//
// The point of the Synced section is verification: a waiting row does not just
// disappear when it lands, it MOVES into Synced with the time it landed. Watching
// a backlog empty after a reconnect is the only way to be sure the writes really
// went through. That list is session-only — it is a receipt, not an audit log.

const EMPTY_SNAP = { pendingCount: 0, status: 'idle', offline: false, items: [], done: [], lastError: null, nextRetryAt: 0, lastSavedAt: null }

function ago(ts) {
  if (!ts) return ''
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

// Icon + colour mirror the buttons the change came from, so a row is recognisable
// before you read it: amber star for nail, red bookmark for important, trash for delete.
function describe(it) {
  if (it.kind === 'delete') return { Icon: Trash2, color: '#f43f5e', text: 'Deleted' }
  const parts = []
  if (it.patch?.nailed !== undefined) parts.push(it.patch.nailed ? 'Nailed' : 'Un-nailed')
  if (it.patch?.important !== undefined) parts.push(it.patch.important ? 'Marked important' : 'Unmarked important')
  const primary = it.patch?.nailed !== undefined
    ? { Icon: Star, color: '#f59e0b' }
    : { Icon: Bookmark, color: '#ef4444' }
  return { ...primary, text: parts.join(' · ') || 'Change' }
}

// Seconds until the queue's next automatic attempt. Like ago(), it reads the
// clock outside the render body — the drawer re-renders on its own ticker.
function retryIn(nextRetryAt) {
  return nextRetryAt ? Math.max(0, Math.round((nextRetryAt - Date.now()) / 1000)) : 0
}

function StateIcon({ state }) {
  if (state === 'synced') return <Check size={14} className="syncq-ic-ok" />
  if (state === 'sending') return <RefreshCw size={14} className="syncq-ic-go sync-spin" />
  if (state === 'failed') return <AlertTriangle size={14} className="syncq-ic-bad" />
  return <Clock size={14} className="syncq-ic-wait" />
}

function Row({ item }) {
  const { Icon, color, text } = describe(item)
  const when = item.state === 'synced' ? `synced ${ago(item.syncedAt)}` : ago(item.at)
  return (
    <div className={`syncq-row syncq-${item.state}`}>
      <span className="syncq-icon" style={{ '--qc': color }}><Icon size={14} /></span>
      <span className="syncq-main">
        <span className="syncq-text">{item.label || 'Saved item'}</span>
        <span className="syncq-meta">
          {text}
          {item.cat ? ` · ${item.cat}` : ''}
          {when ? ` · ${when}` : ''}
        </span>
        {item.err && <span className="syncq-err">{item.err}{item.attempts > 1 ? ` · ${item.attempts} attempts` : ''}</span>}
      </span>
      <StateIcon state={item.state} />
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <div className="syncq-section">
      <div className="syncq-section-head">{title}<span className="syncq-count">{count}</span></div>
      {children}
    </div>
  )
}

export default function SyncDrawer({ open, onClose }) {
  const [snap, setSnap] = useState(EMPTY_SNAP)
  const [, setTick] = useState(0)

  useEffect(() => subscribeQueue((s) => setSnap(s)), [])

  // Relative times and the retry countdown only need to move while you're looking.
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { clearInterval(id); window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  const failed = snap.items.filter((i) => i.state === 'failed')
  const waiting = snap.items.filter((i) => i.state !== 'failed')
  const retrySecs = retryIn(snap.nextRetryAt)

  let tone = 'ok'
  let line = 'Everything is synced'
  let Lead = Check
  if (snap.offline && snap.pendingCount) {
    tone = 'wait'; Lead = CloudOff
    line = `Offline · ${snap.pendingCount} waiting`
  } else if (snap.status === 'saving' && snap.pendingCount) {
    tone = 'go'; Lead = RefreshCw
    line = `Syncing ${snap.pendingCount}…`
  } else if (failed.length) {
    tone = 'bad'; Lead = AlertTriangle
    line = retrySecs ? `Retrying in ${retrySecs}s` : 'Last attempt failed'
  } else if (snap.pendingCount) {
    tone = 'wait'; Lead = Clock
    line = `${snap.pendingCount} waiting to sync`
  } else if (snap.lastSavedAt) {
    line = `All synced · ${ago(snap.lastSavedAt)}`
  }

  const nothing = !snap.items.length && !snap.done.length

  return (
    <>
      {open && <div className="cat-sidebar-overlay sync-drawer-overlay" onClick={onClose} />}
      <aside className={`sync-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="sync-drawer-header">
          <span className="sync-drawer-title"><Cloud size={15} /> Sync queue</span>
          <button className="cat-sidebar-close" onClick={onClose} title="Close"><X size={16} /></button>
        </div>

        <div className="sync-drawer-state">
          <span className={`syncq-line syncq-tone-${tone}`}>
            <Lead size={14} className={tone === 'go' ? 'sync-spin' : undefined} />
            {line}
          </span>
          <button className="syncq-retry" onClick={flushNow} disabled={!snap.pendingCount}>
            <RefreshCw size={13} /> Retry now
          </button>
        </div>

        <div className="sync-drawer-list">
          {failed.length > 0 && (
            <Section title="Failed" count={failed.length}>
              {failed.map((i) => <Row key={i.key} item={i} />)}
            </Section>
          )}
          {waiting.length > 0 && (
            <Section title="Waiting" count={waiting.length}>
              {waiting.map((i) => <Row key={i.key} item={i} />)}
            </Section>
          )}
          {snap.done.length > 0 && (
            <Section title="Synced" count={snap.done.length}>
              {snap.done.map((i) => <Row key={`${i.key}-${i.syncedAt}`} item={i} />)}
            </Section>
          )}
          {nothing && (
            <div className="syncq-empty">
              <Check size={26} />
              <p>Nothing waiting</p>
              <span>{snap.lastSavedAt ? `Last change saved ${ago(snap.lastSavedAt)}.` : 'Nail, important and delete changes show up here until they reach the server.'}</span>
            </div>
          )}
        </div>

        <div className="sync-drawer-foot">
          Changes are kept on this device and sync automatically.
        </div>
      </aside>
    </>
  )
}
