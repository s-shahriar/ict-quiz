import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Category picker for the Important screens: chips wrap into rows (no horizontal
// swipe). With many categories it collapses to ~2 rows behind a fade + a
// "Show all" toggle, so it stays compact yet everything is reachable.
const COLLAPSE_AFTER = 6

export default function CategoryChipBar({ groups, activeId, onSelect }) {
  const [open, setOpen] = useState(false)
  const collapsible = groups.length > COLLAPSE_AFTER
  return (
    <>
      <div className={`nailed-cat-bar${collapsible && !open ? ' collapsed' : ''}`}>
        {groups.map(({ topic: t, items }) => {
          const Icon = t.icon
          const on = activeId === t.id
          return (
            <button
              key={t.id}
              className={`nailed-cat-chip${on ? ' active' : ''}`}
              style={{ '--c': t.color }}
              onClick={() => onSelect(t.id)}
            >
              {Icon && <span className="nailed-cat-chip-ic"><Icon size={16} /></span>}
              <span className="nailed-cat-chip-name">{t.name}</span>
              <span className="nailed-cat-chip-count">{items.length}</span>
            </button>
          )
        })}
      </div>
      {collapsible && (
        <button className="nailed-cat-toggle" onClick={() => setOpen(v => !v)}>
          {open ? <>Show less <ChevronUp size={13} /></> : <>Show all {groups.length} categories <ChevronDown size={13} /></>}
        </button>
      )}
    </>
  )
}
