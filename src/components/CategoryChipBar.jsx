import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Layers } from 'lucide-react'

// Topic switcher for the Important screens. A single dropdown instead of a
// wall of chips: the trigger shows the current topic + its count, the menu
// lists every topic. Pass `allId` to prepend an "All topics" entry (used
// where reading straight through every saved topic makes sense).
export default function CategoryChipBar({ groups, activeId, onSelect, allId, allLabel = 'All topics', allColor = 'var(--imp)' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const showAll = !!allId && groups.length > 1
  const allCount = groups.reduce((s, g) => s + g.items.length, 0)
  const options = [
    ...(showAll ? [{ id: allId, name: allLabel, icon: Layers, color: allColor, count: allCount }] : []),
    ...groups.map(({ topic: t, items }) => ({ id: t.id, name: t.name, icon: t.icon, color: t.color, count: items.length })),
  ]
  const active = options.find(o => o.id === activeId) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!active) return null
  const ActiveIcon = active.icon

  return (
    <div className="cat-switch" ref={rootRef}>
      <button
        type="button"
        className={`cat-switch-trigger${open ? ' open' : ''}`}
        style={{ '--c': active.color }}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        disabled={options.length < 2}
      >
        {ActiveIcon && <span className="cat-switch-ic"><ActiveIcon size={16} /></span>}
        <span className="cat-switch-name">{active.name}</span>
        <span className="cat-switch-count">{active.count}</span>
        {options.length > 1 && <ChevronDown size={16} className="cat-switch-chev" />}
      </button>

      {open && (
        <ul className="cat-switch-menu" role="listbox" aria-label="Choose a topic">
          {options.map(o => {
            const Icon = o.icon
            const on = o.id === active.id
            return (
              <li key={o.id} role="option" aria-selected={on}>
                <button
                  type="button"
                  className={`cat-switch-opt${on ? ' active' : ''}`}
                  style={{ '--c': o.color }}
                  onClick={() => { onSelect(o.id); setOpen(false) }}
                >
                  {Icon && <span className="cat-switch-ic"><Icon size={15} /></span>}
                  <span className="cat-switch-name">{o.name}</span>
                  <span className="cat-switch-count">{o.count}</span>
                  <span className="cat-switch-check">{on && <Check size={15} />}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
