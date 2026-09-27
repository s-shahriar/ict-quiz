import { forwardRef } from 'react'
import { StickyNote } from 'lucide-react'

// Icon-only badge next to the Q-number — deliberately NOT another labelled
// pill in the action row, since that row is already crowded (Nail It /
// Important / Weak). Outline when empty, filled teal when a note exists, so
// scanning a list of cards shows at a glance which ones you've annotated.
// Dumb button: NoteControl owns what tapping it does (open the peek, or go
// straight to the editor when there's nothing yet to peek at). Forwards its
// ref so the peek popover can anchor its position to this exact button.
const NoteButton = forwardRef(function NoteButton(
  { hasNote, onClick, size = 13, className = 'note-badge-btn' },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`${className}${hasNote ? ' has-note' : ''}`}
      onClick={onClick}
      title={hasNote ? 'View your note' : 'Add a note'}
    >
      <StickyNote size={size} fill={hasNote ? 'currentColor' : 'none'} />
    </button>
  )
})

export default NoteButton
