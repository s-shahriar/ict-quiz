import { useEffect, useState } from 'react'
import { AlertTriangle, Bookmark, BookmarkX, Check, Clock, Cloud, CloudOff, RefreshCw, RotateCcw, Star, StarOff, Trash2, Undo2, X } from 'lucide-react'
import { subscribeQueue, flushNow } from '../lib/offlineQueue.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useTrash } from '../contexts/TrashContext.jsx'
import { closeSyncDrawer, subscribeSyncDrawer } from '../lib/syncDrawerState.js'

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
// before you read it. Direction shows as well, because marking and unmarking are
// opposite actions: a flag being set gets the filled icon in its colour, a flag
// being cleared gets the struck-through icon in grey.
const OFF = '#94a3b8'
function describe(it) {
  if (it.kind === 'delete') return { Icon: Trash2, color: '#f43f5e', text: 'Moved to Recycle Bin' }
  if (it.kind === 'restore') return { Icon: RotateCcw, color: '#10b981', text: 'Restored from Recycle Bin' }
  if (it.kind === 'purge') return { Icon: Trash2, color: '#b91c1c', text: 'Deleted forever', filled: true }
  const { nailed, important } = it.patch || {}
  const parts = []
  if (nailed !== undefined) parts.push(nailed ? 'Nailed' : 'Un-nailed')
  if (important !== undefined) parts.push(important ? 'Marked important' : 'Unmarked important')
  // When both columns changed, the nail leads — the same order as the text.
  if (nailed !== undefined) {
    return { Icon: nailed ? Star : StarOff, color: nailed ? '#f59e0b' : OFF, filled: nailed, text: parts.join(' · ') }
  }
  if (important !== undefined) {
    return { Icon: important ? Bookmark : BookmarkX, color: important ? '#ef4444' : OFF, filled: important, text: parts.join(' · ') }
  }
  return { Icon: Bookmark, color: OFF, text: 'Change' }
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

function Row({ item, undo }) {
  const { Icon, color, text, filled } = describe(item)
  const when = item.state === 'synced' ? `synced ${ago(item.syncedAt)}` : ago(item.at)
  return (
    <div className={`syncq-row syncq-${item.state}`}>
      <span className="syncq-icon" style={{ '--qc': color }}><Icon size={14} fill={filled ? 'currentColor' : 'none'} /></span>
      <span className="syncq-main">
        <span className="syncq-text">{item.label || 'Saved item'}</span>
        <span className="syncq-meta">
          {text}
          {item.cat ? ` · ${item.cat}` : ''}
          {when ? ` · ${when}` : ''}
        </span>
        {item.err && <span className="syncq-err">{item.err}{item.attempts > 1 ? ` · ${item.attempts} attempts` : ''}</span>}
      </span>
      <span className="syncq-side">
        <StateIcon state={item.state} />
        {undo && (
          <button
            type="button"
            className="syncq-undo"
            disabled={undo.blocked}
            onClick={undo.run}
            title={undo.blocked ? 'Deleted forever — this cannot be undone' : 'Undo this change'}
          >
            <Undo2 size={13} /> Undo
          </button>
        )}
      </span>
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

export default function SyncDrawer() {
  const [snap, setSnap] = useState(EMPTY_SNAP)
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)
  const nail = useMasteredContext()
  const imp = useImportantContext()
  const trash = useTrash()

  useEffect(() => subscribeQueue((s) => setSnap(s)), [])
  useEffect(() => subscribeSyncDrawer(setOpen), [])

  // Relative times and the retry countdown only need to move while you're looking.
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    const esc = (e) => { if (e.key === 'Escape') closeSyncDrawer() }
    window.addEventListener('keydown', esc)
    return () => { clearInterval(id); window.removeEventListener('keydown', esc) }
  }, [open])

  const failed = snap.items.filter((i) => i.state === 'failed')
  const waiting = snap.items.filter((i) => i.state !== 'failed')
  const retrySecs = retryIn(snap.nextRetryAt)

  // Undo applies the opposite action through the same code the on-page buttons
  // use, so the card changes too and the reversal lands in this list as a row of
  // its own. Only an action still in effect offers undo: once something later has
  // reversed it — including an undo — its row stops offering one.
  function undoFor(it) {
    if (it.kind === 'purge') return { blocked: true }
    const q = { _id: it.id, _uid: it.uid, _module: it.module, _catName: it.cat, question: it.label }
    if (it.kind === 'delete') return it.id && trash.isTrashed(it.id) ? { run: () => trash.restore(q) } : null
    if (it.kind === 'restore') return it.id && !trash.isTrashed(it.id) ? { run: () => trash.moveToBin(q) } : null
    const { nailed, important } = it.patch || {}
    if (!it.uid || (nailed === undefined && important === undefined)) return null
    const inEffect = (nailed === undefined || nail.value.has(it.uid) === nailed)
      && (important === undefined || imp.value.has(it.uid) === important)
    if (!inEffect) return null
    return {
      run: () => {
        if (nailed !== undefined) (nailed ? nail.remove : nail.add)(it.uid)
        if (important !== undefined) (important ? imp.remove : imp.add)(it.uid)
      },
    }
  }

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
      {open && <div className="cat-sidebar-overlay sync-drawer-overlay" onClick={closeSyncDrawer} />}
      <aside className={`sync-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="sync-drawer-header">
          <span className="sync-drawer-title"><Cloud size={15} /> Sync queue</span>
          <button className="cat-sidebar-close" onClick={closeSyncDrawer} title="Close"><X size={16} /></button>
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
              {failed.map((i) => <Row key={i.key} item={i} undo={undoFor(i)} />)}
            </Section>
          )}
          {waiting.length > 0 && (
            <Section title="Waiting" count={waiting.length}>
              {waiting.map((i) => <Row key={i.key} item={i} undo={undoFor(i)} />)}
            </Section>
          )}
          {snap.done.length > 0 && (
            <Section title="Synced" count={snap.done.length}>
              {snap.done.map((i) => <Row key={`${i.key}-${i.syncedAt}`} item={i} undo={undoFor(i)} />)}
            </Section>
          )}
          {nothing && (
            <div className="syncq-empty">
              <Check size={26} />
              <p>Nothing waiting</p>
              <span>{snap.lastSavedAt ? `Last change saved ${ago(snap.lastSavedAt)}.` : 'Nail, important, delete and Recycle Bin changes show up here until they reach the server.'}</span>
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
