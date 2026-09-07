import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Highlighter, Eraser } from 'lucide-react'
import { selectionToAnchors } from '../../lib/textAnchor.js'
import { useHighlights } from '../../contexts/HighlightContext.jsx'
import { placeBar } from '../../lib/barPlacement.js'

// Floating "Highlight" / "Remove" bar, PDF-reader style.
//
// Mobile is the primary case here, which drives three decisions:
//  • `selectionchange` (not mouseup) is the event that fires when Android's
//    selection handles are dragged, so it is what we listen to, debounced past
//    the handle-drag so the bar does not flicker under the user's thumb.
//  • Android draws its own Copy/Share bar directly ABOVE the selection, so ours
//    goes BELOW by default and only flips above when there is no room, keeping
//    the two from covering each other.
//  • Touch targets are full-height buttons, and the bar is clamped inside the
//    viewport so it never hangs off the edge of a narrow screen.
//
// Tapping an existing mark opens the same bar in remove mode.

const SETTLE_MS = 320          // let Android's handles settle before showing

export default function HighlightBar() {
  const { add, remove, canHighlight } = useHighlights()
  const [bar, setBar] = useState(null)   // { x, y, above, mode, uid, anchors|ids }
  const barRef = useRef(null)
  const timer = useRef(null)
  // How to re-measure the thing the bar is pointing at. Kept in a ref so a
  // scroll can reposition the bar instead of dismissing it — Android nudges the
  // page while you drag the selection handles, and hiding on every scroll would
  // make the bar disappear the moment it appeared.
  const measure = useRef(null)

  useEffect(() => {
    const hide = () => setBar(null)

    const place = (rect, payload) =>
      setBar({ ...placeBar(rect, window.innerWidth, window.innerHeight), ...payload })

    const reposition = () => {
      const rect = measure.current?.()
      if (!rect) return hide()
      setBar(b => b && { ...b, ...placeBar(rect, window.innerWidth, window.innerHeight) })
    }

    const onSelectionChange = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !sel.rangeCount) return hide()
        const root = (sel.anchorNode?.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode)
          ?.closest?.('[data-hl-root]')
        if (!root) return hide()
        const uid = root.getAttribute('data-hl-root')
        const anchors = selectionToAnchors(sel)
        if (!anchors.length) return hide()
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        if (!rect.width && !rect.height) return hide()
        measure.current = () => {
          const s2 = window.getSelection()
          if (!s2 || s2.isCollapsed || !s2.rangeCount) return null
          return s2.getRangeAt(0).getBoundingClientRect()
        }
        place(rect, { mode: 'add', uid, anchors })
      }, SETTLE_MS)
    }

    // Tap/click straight on an existing mark → offer to remove it.
    const onPointerDown = (e) => {
      const mark = e.target.closest?.('.hl-mark')
      if (!mark) {
        if (!barRef.current?.contains(e.target)) hide()
        return
      }
      const root = mark.closest('[data-hl-root]')
      if (!root) return
      window.clearTimeout(timer.current)
      measure.current = () => mark.isConnected ? mark.getBoundingClientRect() : null
      place(mark.getBoundingClientRect(), {
        mode: 'remove',
        uid: root.getAttribute('data-hl-root'),
        ids: mark.getAttribute('data-hl-ids').split(','),
      })
    }

    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.clearTimeout(timer.current)
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [])

  if (!bar || !canHighlight) return null

  const act = async (e) => {
    e.preventDefault(); e.stopPropagation()
    if (bar.mode === 'add') await add(bar.uid, bar.anchors)
    else await remove(bar.uid, bar.ids)
    window.getSelection()?.removeAllRanges()
    measure.current = null
    setBar(null)
  }

  return createPortal(
    <div
      ref={barRef}
      className="hl-bar"
      style={{ left: bar.x, top: bar.y, transform: `translate(-50%, ${bar.above ? '-100%' : '0'})` }}
      // pointerdown, not click: on Android a click would first dismiss the
      // selection and the range would be gone by the time the handler ran.
      onPointerDown={act}
    >
      {bar.mode === 'add'
        ? <><Highlighter size={15} /><span>Highlight</span></>
        : <><Eraser size={15} /><span>Remove</span></>}
    </div>,
    document.body
  )
}
