import { useState } from 'react'
import { useNotesContext } from '../../contexts/ProgressContext.jsx'

// One note-editing session for a question, shared by its NoteButton badge and
// its NoteCallout's "Edit" link — both open the SAME dialog instance rather
// than each owning a separate one.
export function useNoteEditor(uid) {
  const { get, set, remove } = useNotesContext()
  const [open, setOpen] = useState(false)
  const note = uid ? get(uid) : ''
  return {
    note,
    open,
    openEditor: () => setOpen(true),
    closeEditor: () => setOpen(false),
    save: (text) => set(uid, text),
    remove: () => remove(uid),
  }
}
