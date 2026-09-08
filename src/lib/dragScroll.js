// Drag-to-pan for the wide ASCII diagram blocks.
//
// The subnetting diagrams spell out every address, so they are wider than the
// window and have to be scrolled sideways. Reaching for the scrollbar at the
// very bottom of the block is awkward, so grabbing the diagram itself and
// dragging pans it, the same gesture a phone already gives you with a swipe.
//
// Listeners are delegated from the document, so this works for every diagram in
// the app — including ones rendered later — without touching a render site.
//
// Two things are deliberately left alone:
//   • Touch. A phone already pans an overflowing block natively, and taking
//     that over would also break the long-press that starts a selection.
//   • Shift-drag, and a drag that starts on an existing highlight. Diagram text
//     is highlightable, so there has to be a way to select inside one; holding
//     Shift selects exactly as before, and a press on a mark still opens the
//     highlight bar.

const SELECTOR = '.written-diagram-pre'
const THRESHOLD = 6            // px of movement before a click becomes a drag

export function initDragScroll() {
  let el = null, startX = 0, startScroll = 0, panning = false, pointer = null

  const stop = () => {
    if (el) {
      el.classList.remove('is-panning')
      if (pointer != null) { try { el.releasePointerCapture(pointer) } catch { /* already gone */ } }
    }
    el = null; panning = false; pointer = null
  }

  const onDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.shiftKey) return
    const pre = e.target.closest?.(SELECTOR)
    if (!pre || pre.scrollWidth <= pre.clientWidth) return   // nothing to pan
    if (e.target.closest?.('.hl-mark')) return               // let the highlight bar have it
    el = pre; startX = e.clientX; startScroll = pre.scrollLeft
    panning = false; pointer = e.pointerId
  }

  const onMove = (e) => {
    if (!el || e.pointerId !== pointer) return
    const dx = e.clientX - startX
    if (!panning) {
      if (Math.abs(dx) < THRESHOLD) return
      panning = true
      el.classList.add('is-panning')                         // sets user-select: none
      window.getSelection()?.removeAllRanges()               // drop what the drag picked up
      try { el.setPointerCapture(pointer) } catch { /* not captureable, still works */ }
    }
    el.scrollLeft = startScroll - dx
  }

  document.addEventListener('pointerdown', onDown)
  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', stop)
  document.addEventListener('pointercancel', stop)
  return () => {
    document.removeEventListener('pointerdown', onDown)
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', stop)
    document.removeEventListener('pointercancel', stop)
  }
}
