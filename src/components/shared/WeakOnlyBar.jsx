import { Bookmark, Flame } from 'lucide-react'

// "All Important / Weak only" switch at the top of the Important screens. Weak
// is a subset of Important, so this narrows the same list rather than leaving it.
export default function WeakOnlyBar({ weakOnly, onChange, importantCount, weakCount }) {
  return (
    <div className="study-filter-bar saved-weak-switch">
      <button
        className={`study-filter-btn${!weakOnly ? ' active' : ''}`}
        onClick={() => onChange(false)}
        style={!weakOnly ? { borderColor: 'var(--imp)', color: 'var(--imp)', background: 'var(--imp-tint)' } : {}}
      >
        <Bookmark size={11} fill={!weakOnly ? 'currentColor' : 'none'} />
        সব Important ({importantCount})
      </button>
      <button
        className={`study-filter-btn${weakOnly ? ' active' : ''}`}
        onClick={() => onChange(true)}
        style={weakOnly ? { borderColor: 'var(--weak)', color: 'var(--weak)', background: 'var(--weak-tint)' } : {}}
      >
        <Flame size={11} fill={weakOnly ? 'currentColor' : 'none'} />
        শুধু Weak ({weakCount})
      </button>
    </div>
  )
}
