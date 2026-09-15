import { Bookmark, Flame } from 'lucide-react'

// "All Important / Weak only" switch at the top of the Important screens. Weak
// is a subset of Important, so this narrows the same list rather than leaving it.
export default function WeakOnlyBar({ weakOnly, onChange, importantCount, weakCount }) {
  return (
    <div className="study-filter-bar saved-weak-switch">
      <button
        className={`study-filter-btn${!weakOnly ? ' active' : ''}`}
        onClick={() => onChange(false)}
        style={!weakOnly ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' } : {}}
      >
        <Bookmark size={11} fill={!weakOnly ? 'currentColor' : 'none'} />
        সব Important ({importantCount})
      </button>
      <button
        className={`study-filter-btn${weakOnly ? ' active' : ''}`}
        onClick={() => onChange(true)}
        style={weakOnly ? { borderColor: '#f97316', color: '#f97316', background: 'rgba(249,115,22,0.12)' } : {}}
      >
        <Flame size={11} fill={weakOnly ? 'currentColor' : 'none'} />
        শুধু Weak ({weakCount})
      </button>
    </div>
  )
}
