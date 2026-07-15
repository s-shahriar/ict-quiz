import { createContext, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X, RotateCcw } from 'lucide-react'
import { getToastRail } from '../lib/toastRail.js'
import { useAuth } from './AuthContext.jsx'
import { trashQuestion, restoreQuestion, purgeQuestion } from '../lib/trashSync.js'
import { invalidateModule } from '../data/contentLoader.js'
import LoginPrompt from '../components/auth/LoginPrompt.jsx'

// Recycle-bin state. Delete is a global, confirmed curation action (not queued):
//   requestDelete(q) → confirm modal → trash_question RPC → hide everywhere.
// `trashedIds` hides just-deleted rows in the current session without a reload;
// the loader's deleted_at filter keeps them gone after a refresh.

const TrashContext = createContext(null)
const EMPTY = new Set()

export function TrashProvider({ children }) {
  const { user, signInWithGoogle } = useAuth()
  const [pending, setPending] = useState(null)   // { q, onDone } awaiting confirm
  const [busy, setBusy] = useState(false)
  const [trashedIds, setTrashedIds] = useState(() => new Set())
  const [promptLogin, setPromptLogin] = useState(false)
  const [toast, setToast] = useState(null)

  const flash = (msg) => { setToast(msg); window.clearTimeout(flash._t); flash._t = window.setTimeout(() => setToast(null), 3000) }

  const requestDelete = (q, onDone) => {
    if (!q?._id) return
    if (!user) { setPromptLogin(true); return }
    setPending({ q, onDone })
  }

  const confirmDelete = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await trashQuestion(pending.q._id)
      setTrashedIds(s => new Set(s).add(pending.q._id))
      const done = pending.onDone
      setPending(null)
      flash('Moved to Recycle Bin')
      if (done) done()
    } catch (e) {
      flash(`Delete failed: ${e.message}`)
    } finally { setBusy(false) }
  }

  const restore = async (q) => {
    await restoreQuestion(q._id)
    setTrashedIds(s => { const n = new Set(s); n.delete(q._id); return n })
    if (q._module) invalidateModule(q._module)
  }
  const purge = async (q) => { await purgeQuestion(q._id) }

  const value = {
    requestDelete, restore, purge,
    trashedIds: user ? trashedIds : EMPTY,
    isTrashed: (id) => trashedIds.has(id),
  }

  return (
    <TrashContext.Provider value={value}>
      {children}

      {pending && (
        <div className="trash-modal-backdrop" onClick={() => !busy && setPending(null)}>
          <div className="trash-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="trash-modal-icon"><Trash2 size={22} /></div>
            <h3 className="trash-modal-title">Delete this question?</h3>
            <p className="trash-modal-sub">It moves to the Recycle Bin — you can restore it later or delete it forever.</p>
            <div className="trash-modal-preview">{pending.q.question}</div>
            <div className="trash-modal-actions">
              <button className="trash-btn-cancel" onClick={() => setPending(null)} disabled={busy}>Cancel</button>
              <button className="trash-btn-confirm" onClick={confirmDelete} disabled={busy}>
                <Trash2 size={14} /> {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && createPortal(
        <div className="trash-toast" aria-live="polite">
          {toast.startsWith('Delete failed') ? <X size={14} /> : <RotateCcw size={14} />}
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
