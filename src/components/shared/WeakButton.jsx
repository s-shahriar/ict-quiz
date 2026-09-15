import { Flame } from 'lucide-react'
import { useImportantContext } from '../../contexts/ImportantContext.jsx'
import { useMasteredContext } from '../../contexts/MasteredContext.jsx'
import { useWeakContext } from '../../contexts/WeakContext.jsx'

// Weak toggle that sits right after Important. Weak = an Important item you
// still can't answer, so it only renders once the item is Important and not
// Nailed (nailing clears Weak). Reuses the caller's button class so it lines up
// with its row; `label` adds the text and `style` is applied while it is on (for
// rows that colour buttons inline).
export default function WeakButton({ uid, className, size = 14, label = false, onLabel = 'Weak ✓', onClass = 'marked', style }) {
  const { value: important } = useImportantContext()
  const { value: nailed } = useMasteredContext()
  const { value: weak, add, remove } = useWeakContext()
  if (!uid || !important.has(uid) || nailed.has(uid)) return null
  const on = weak.has(uid)
  return (
    <button
      type="button"
      className={`${className}${on ? ` ${onClass}` : ''}`}
      onClick={e => { e.stopPropagation(); (on ? remove : add)(uid) }}
      title={on ? 'Weak — click to remove' : 'Mark as Weak — এখনো পারি না'}
      aria-pressed={on}
      style={on ? style : undefined}
    >
      <Flame size={size} fill={on ? 'currentColor' : 'none'} />
      {label && <span className="qmark-label">{on ? onLabel : 'Weak'}</span>}
    </button>
  )
}
