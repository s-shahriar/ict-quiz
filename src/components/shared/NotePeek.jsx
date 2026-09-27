import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { StickyNote, Trash2 } from 'lucide-react'
import HighlightableText from './HighlightableText.jsx'
import { useHighlights } from '../../contexts/HighlightContext.jsx'

// Floating peek at a saved note, shown by NoteControl when its badge is
// tapped — replaces the note sitting inline in the card by default, which
// permanently ate space even when you weren't looking at it. Position and
// dismissal (outside click, Escape, resize, scroll, off-screen clamping)
// come from the caller's useFloatingPopover.
export default function NotePeek({ uid, text, pos, popRef, onEdit, onRemove }) {
  const { getFor } = useHighlights()
  const hl = uid ? getFor(uid).filter(h => h.block === 'note') : undefined

  // Tap-again-to-confirm, same pattern as Stop Exam — a note can't be
  // recovered once removed, so one accidental tap shouldn't be enough.
  const [confirmRemove, setConfirmRemove] = useState(false)
  useEffect(() => {
    if (!confirmRemove) return
    const t = setTimeout(() => setConfirmRemove(false), 3000)
    return () => clearTimeout(t)
  }, [confirmRemove])

  const handleRemoveClick = () => {
    if (confirmRemove) { onRemove(); return }
    setConfirmRemove(true)
  }

  return createPortal(
    <div
      ref={popRef}
      className="note-callout note-peek"
      role="dialog"
      aria-label="Your note"
      data-hl-root={uid || undefined}
      style={{ top: pos.top, left: pos.left, right: pos.right }}
    >
      <div className="note-callout-head">
        <StickyNote size={14} />
        <span>Your note</span>
        <button type="button" className="note-callout-edit" onClick={onEdit}>Edit</button>
        <button
          type="button"
          className={`note-peek-remove${confirmRemove ? ' confirm' : ''}`}
          onClick={handleRemoveClick}
          title={confirmRemove ? 'Tap again to remove' : 'Remove note'}
          aria-label={confirmRemove ? 'Tap again to remove note' : 'Remove note'}
        >
          <Trash2 size={13} />
        </button>
      </div>
      <HighlightableText as="p" className="note-callout-text" block="note" text={text} highlights={hl} />
    </div>,
    document.body
  )
}
