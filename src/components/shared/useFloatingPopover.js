import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Shared open/position state for a small position:fixed popover anchored to a
// trigger button (the "⋯" menu, a note peek, …): computes the anchor's screen
// position on open, and closes on outside click, Escape, resize, or scroll.
// A fixed popup can't track its anchor across a scroll — the anchor moves
// under it while the popup stays put, so it ends up hovering, detached, over
// unrelated content. Rather than fight that, we just close it, the same way
// a native menu would.
export function useFloatingPopover({ align = 'auto', gap = 6 } = {}) {
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

  // The width of what we're positioning isn't known until it's actually in
  // the DOM (it depends on its content), so the first paint above is a best
  // guess from the anchor's edge. Once real, measure it and pull it back
  // on-screen if that guess overflowed — otherwise, on a narrow phone, a
  // popover anchored near the left edge of its button spills off the left of
  // the viewport and all you see is an empty sliver of its background with
  // no content in it (the content rendered off-screen).
  useLayoutEffect(() => {
    if (!open || !popRef.current) return
    const r = popRef.current.getBoundingClientRect()
    const margin = 8
    if (r.left < margin) {
      setPos(p => ({ top: p.top, left: margin }))
    } else if (r.right > window.innerWidth - margin) {
      setPos(p => ({ top: p.top, left: Math.max(margin, window.innerWidth - margin - r.width) }))
    }
    // Only re-run when a fresh open sets a new starting guess to clamp.
  }, [open])

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      // Some rows pair a small icon button with a taller sibling — e.g. a
      // note badge sharing a row with a question that wraps to two lines.
      // Anchoring purely to the button's own (short) height then drops the
      // popover right on top of that sibling's second line. Anchor below
      // the whole row instead, so a taller neighbour is cleared too.
      const rowBottom = btnRef.current.parentElement?.getBoundingClientRect().bottom
      const top = Math.max(r.bottom, rowBottom ?? 0) + gap
      // Where the trigger button sits inside its own row varies by screen
      // (some put "⋯" last, some — reversed rows, RTL-ish icon groups —
      // end up with it near the row's start), so a fixed left/right
      // preference anchored the popover off the edge of the card on
      // whichever screens didn't match the guess. Instead, extend toward
      // whichever side actually has more room.
      const spaceRight = window.innerWidth - r.left
      const spaceLeft = r.right
      const anchorLeft = align === 'left' || (align === 'auto' && spaceRight >= spaceLeft)
      setPos(anchorLeft
        ? { top, left: r.left }
        : { top, right: Math.max(8, window.innerWidth - r.right) })
    }
    setOpen(o => !o)
  }

  return { open, pos, btnRef, popRef, toggle, close: () => setOpen(false) }
}
