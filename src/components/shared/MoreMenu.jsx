import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'

// Overflow menu for the row of per-question actions: houses the rarely-tapped
// ones (currently just Delete) behind one "⋯" trigger so the row itself only
// ever shows the flags people toggle constantly (Nail It / Important / Weak).
// Children are whatever action buttons the caller passes — each manages its
// own click behaviour and dialog, so this only needs to close itself the
// instant something inside is clicked.
export default function MoreMenu({ className = '', size = 14, children }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const popRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', () => setOpen(false))
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className={`${className} more-menu-btn`.trim()}
        onClick={toggle}
        title="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={size} strokeWidth={1.8} />
      </button>
      {open && pos && createPortal(
        <div
          ref={popRef}
          className="more-menu-pop"
          role="menu"
          style={{ top: pos.top, right: pos.right }}
          onClickCapture={() => setOpen(false)}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  )
}
