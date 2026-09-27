import { StickyNote } from 'lucide-react'

// Icon-only badge next to the Q-number — deliberately NOT another labelled
// pill in the action row, since that row is already crowded (Nail It /
// Important / Weak). Outline when empty, filled teal when a note exists, so
// scanning a list of cards shows at a glance which ones you've annotated.
// Dumb button: the editing session (open/save/remove) lives in useNoteEditor,
// shared with NoteCallout's "Edit" link so both open the same dialog.
export default function NoteButton({ hasNote, onClick, size = 13, className = 'note-badge-btn' }) {
  return (
    <button
      type="button"
      className={`${className}${hasNote ? ' has-note' : ''}`}
      onClick={onClick}
      title={hasNote ? 'Edit your note' : 'Add a note'}
    >
      <StickyNote size={size} fill={hasNote ? 'currentColor' : 'none'} />
    </button>
  )
}
