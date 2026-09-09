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
// Panning must not cost you text selection: diagram text is highlightable, and
// taking the plain drag for panning made every letter unselectable. So the
// press point decides which gesture you get.
//
//   pressed on a character  ->  select, exactly as before
//   pressed on blank space  ->  pan
//
// These diagrams are mostly blank — wide gaps between columns, a long right
// margin, empty lines between steps — so there is always somewhere to grab.
// The test is biased towards selection: the character on EITHER side of the
// caret has to be blank before a drag counts as a pan.
//
// Touch is left alone. A phone already pans an overflowing block natively, and
// taking that over would break the long-press that starts a selection.

const SELECTOR = '.written-diagram-pre'
const THRESHOLD = 6            // px of movement before a click becomes a drag

// Is there a visible character under (x, y)? The caret lands on a boundary
// between two characters, so both neighbours are checked — a press anywhere on
// a glyph then counts as being on it, whichever half was hit.
function onGlyph(x, y) {
  let node, offset
  const pos = document.caretPositionFromPoint?.(x, y)
  if (pos) { node = pos.offsetNode; offset = pos.offset }
  else {
    const range = document.caretRangeFromPoint?.(x, y)
    if (!range) return true            // cannot tell -> leave selection alone
    node = range.startContainer; offset = range.startOffset
  }
  if (!node || node.nodeType !== 3) return true
  const here = node.data[offset] || ''
  const before = offset > 0 ? node.data[offset - 1] : ''
  return (here !== '' && !/\s/.test(here)) || (before !== '' && !/\s/.test(before))
}

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
    if (onGlyph(e.clientX, e.clientY)) return                // pressed on text -> selecting
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
