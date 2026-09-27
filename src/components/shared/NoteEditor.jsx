import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { StickyNote, X } from 'lucide-react'

// The Note popup: reuses the trash-modal shell (centred on desktop, bottom
// sheet on phones via CSS), same shell every confirm dialog in this app uses.
// Local textarea state only — nothing is written until Save.
export default function NoteEditor({ initial, onSave, onRemove, onClose }) {
  const [text, setText] = useState(initial || '')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const changed = text.trim() !== (initial || '').trim()

  return createPortal(
    <div className="trash-modal-backdrop note-backdrop" onClick={onClose}>
      <div className="trash-modal note-modal" role="dialog" aria-modal="true" aria-labelledby="note-title" onClick={(e) => e.stopPropagation()}>
        <div className="note-modal-head">
          <h3 id="note-title" className="trash-modal-title note-modal-title">
            <StickyNote size={16} /> Note
          </h3>
          <button className="cat-sidebar-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <textarea
          className="note-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a private note for this question — a trick you fell for, a rule to remember, a reason it's tricky…"
          autoFocus
        />

        <div className="trash-modal-actions">
          {initial && (
            <button className="btn-remove-note" onClick={() => { onRemove(); onClose() }}>
              Remove note
            </button>
          )}
          <button className="trash-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="trash-btn-confirm note-save"
            disabled={!changed}
            onClick={() => { onSave(text); onClose() }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
