import { createContext, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, CloudOff, RotateCcw } from 'lucide-react'
import { getToastRail } from '../lib/toastRail.js'
import { useAuth } from './AuthContext.jsx'
import { enqueueBinAction, enqueueDelete, onRestoreLanded } from '../lib/offlineQueue.js'
import { invalidateModule } from '../data/contentLoader.js'
import LoginPrompt from '../components/auth/LoginPrompt.jsx'

// Recycle-bin state. Delete is a global, confirmed curation action:
//   requestDelete(q) → confirm modal → offline queue → trash_question RPC.
// `trashedIds` hides just-deleted rows in the current session without a reload;
// the loader's deleted_at filter keeps them gone after a refresh. The write goes
// through the same queue as nail/important, so a delete made offline is kept and
// replayed instead of failing — track it in the sync drawer until it lands.

const TrashContext = createContext(null)
const EMPTY = new Set()

export function TrashProvider({ children }) {
  const { user, signInWithGoogle } = useAuth()
  const [pending, setPending] = useState(null)   // { q, onDone } awaiting confirm
  const [trashedIds, setTrashedIds] = useState(() => new Set())
  const [promptLogin, setPromptLogin] = useState(false)
  const [toast, setToast] = useState(null)

  const flash = (msg) => { setToast(msg); window.clearTimeout(flash._t); flash._t = window.setTimeout(() => setToast(null), 3000) }

  const requestDelete = (q, onDone) => {
    if (!q?._id) return
    if (!user) { setPromptLogin(true); return }
    setPending({ q, onDone })
  }

  // Hide immediately and hand the write to the queue: offline, it waits there
  // and replays on reconnect rather than failing. Until it lands the question is
  // still visible on your other devices.
  const confirmDelete = () => {
    if (!pending) return
    enqueueDelete(pending.q)
    setTrashedIds(s => new Set(s).add(pending.q._id))
    const done = pending.onDone
    setPending(null)
    flash(navigator.onLine === false ? 'Queued — deletes when you\'re back online' : 'Moved to Recycle Bin')
    if (done) done()
  }

  // Recycle Bin actions go through the same queue as delete, so they show in the
  // sync drawer and survive being offline. The module is re-fetched when the
  // restore lands rather than now: re-fetching before the server has it would
  // load the question still marked deleted.
  const restore = (q) => {
    enqueueBinAction(q, 'restore')
    setTrashedIds(s => { const n = new Set(s); n.delete(q._id); return n })
  }
  const purge = (q) => { enqueueBinAction(q, 'purge') }

  // Undo from the sync drawer. It reverses a restore the user just made, so it
  // goes straight back to the bin without the delete confirmation.
  const moveToBin = (q) => {
    if (!q?._id) return
    enqueueDelete(q)
    setTrashedIds(s => new Set(s).add(q._id))
  }

  useEffect(() => onRestoreLanded((modules) => modules.forEach((m) => invalidateModule(m))), [])

  const value = {
    requestDelete, restore, purge,
    moveToBin,
    trashedIds: user ? trashedIds : EMPTY,
    isTrashed: (id) => trashedIds.has(id),
  }

  return (
    <TrashContext.Provider value={value}>
      {children}

      {pending && (
        <div className="trash-modal-backdrop" onClick={() => setPending(null)}>
          <div className="trash-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="trash-modal-icon"><Trash2 size={22} /></div>
            <h3 className="trash-modal-title">Delete this question?</h3>
            <p className="trash-modal-sub">It moves to the Recycle Bin — you can restore it later or delete it forever.</p>
            <div className="trash-modal-preview">{pending.q.question || pending.q.q}</div>
            <div className="trash-modal-actions">
              <button className="trash-btn-cancel" onClick={() => setPending(null)}>Cancel</button>
              <button className="trash-btn-confirm" onClick={confirmDelete}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && createPortal(
        <div className="trash-toast" aria-live="polite">
          {toast.startsWith('Queued') ? <CloudOff size={14} /> : <RotateCcw size={14} />}
          <span>{toast}</span>
        </div>,
        getToastRail()
      )}

      {promptLogin && <LoginPrompt onGoogle={signInWithGoogle} onClose={() => setPromptLogin(false)} />}
    </TrashContext.Provider>
  )
}

export function useTrash() {
  const ctx = useContext(TrashContext)
  if (!ctx) throw new Error('useTrash must be used within TrashProvider')
  return ctx
}
