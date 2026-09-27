import { useFloatingPopover } from './useFloatingPopover.js'
import NoteButton from './NoteButton.jsx'
import NotePeek from './NotePeek.jsx'

// Bundles the note badge with its floating peek, so every call site swaps
// one `<NoteButton>` + one inline `<NoteCallout>` for this single component.
// Hidden by default: tapping the badge shows the saved note as a popover
// near the icon rather than it sitting permanently in the card. No note yet
// → nothing to peek at, so the badge goes straight to the editor.
export default function NoteControl({ uid, noteEditor, className, size }) {
  const { open, pos, btnRef, popRef, toggle, close } = useFloatingPopover()
  const hasNote = Boolean(noteEditor.note)

  return (
    <>
      <NoteButton
        ref={btnRef}
        hasNote={hasNote}
        className={className}
        size={size}
        onClick={(e) => {
          // Some callers put this badge in a row whose own onClick expands/
          // collapses a card (e.g. a written-answer header) — stop that.
          e.stopPropagation()
          if (hasNote) toggle()
          else noteEditor.openEditor()
        }}
      />
      {open && pos && (
        <NotePeek
          uid={uid}
          text={noteEditor.note}
          pos={pos}
          popRef={popRef}
          onEdit={() => { close(); noteEditor.openEditor() }}
        />
      )}
    </>
  )
}
