import { Trash2 } from 'lucide-react'
import { useTrash } from '../../contexts/TrashContext.jsx'

// Delete control beside Nail It / Important. Reuses the caller's button class for
// shape, plus `qdelete-btn` for the red accent. Renders nothing when the question
// has no DB row id (e.g. bundled-only Practice content), so those places skip it.
export default function DeleteButton({ question, className = '', size = 14, iconOnly = false, onDeleted }) {
  const { requestDelete } = useTrash()
  if (!question?._id) return null
  return (
    <button
      type="button"
      className={`${className} qdelete-btn`.trim()}
      onClick={() => requestDelete(question, onDeleted)}
      title="Delete question"
    >
      <Trash2 size={size} strokeWidth={1.8} />
      {!iconOnly && <span className="qmark-label">Delete</span>}
    </button>
  )
}
