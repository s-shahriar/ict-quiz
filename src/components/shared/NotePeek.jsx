import { createPortal } from 'react-dom'
import { StickyNote } from 'lucide-react'
import HighlightableText from './HighlightableText.jsx'
import { useHighlights } from '../../contexts/HighlightContext.jsx'

// Floating peek at a saved note, shown by NoteControl when its badge is
// tapped — replaces the note sitting inline in the card by default, which
// permanently ate space even when you weren't looking at it. Position and
// dismissal (outside click, Escape, resize, scroll) come from the caller's
// useFloatingPopover, so it never gets left stranded mid-air the way the
// old Topic/Delete menu did before that got the same fix.
export default function NotePeek({ uid, text, pos, popRef, onEdit }) {
  const { getFor } = useHighlights()
  const hl = uid ? getFor(uid).filter(h => h.block === 'note') : undefined

  return createPortal(
    <div
      ref={popRef}
      className="note-callout note-peek"
      role="dialog"
      aria-label="Your note"
      data-hl-root={uid || undefined}
      style={{ top: pos.top, right: pos.right }}
    >
      <div className="note-callout-head">
        <StickyNote size={14} />
        <span>Your note</span>
        <button type="button" className="note-callout-edit" onClick={onEdit}>Edit</button>
      </div>
      <HighlightableText as="p" className="note-callout-text" block="note" text={text} highlights={hl} />
    </div>,
    document.body
  )
}
