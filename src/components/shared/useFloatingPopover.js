import { useEffect, useRef, useState } from 'react'

// Shared open/position state for a small position:fixed popover anchored to a
// trigger button (the "⋯" menu, a note peek, …): computes the anchor's screen
// position on open, and closes on outside click, Escape, resize, or scroll.
// A fixed popup can't track its anchor across a scroll — the anchor moves
// under it while the popup stays put, so it ends up hovering, detached, over
// unrelated content. Rather than fight that, we just close it, the same way
// a native menu would.
export function useFloatingPopover({ align = 'right', gap = 6 } = {}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const popRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e) => {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      close()
    }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    // capture:true so this also catches scrolling inside a scrollable
    // ancestor (a list container), not just the window itself.
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos(align === 'left'
        ? { top: r.bottom + gap, left: r.left }
        : { top: r.bottom + gap, right: Math.max(8, window.innerWidth - r.right) })
    }
    setOpen(o => !o)
  }

  return { open, pos, btnRef, popRef, toggle, close: () => setOpen(false) }
}
