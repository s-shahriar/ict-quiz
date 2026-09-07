import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import { selectionToAnchors } from '../../lib/textAnchor.js'
import { placeBar } from '../../lib/barPlacement.js'
import { COLORS } from '../../lib/highlightSync.js'
import { useHighlights } from '../../contexts/HighlightContext.jsx'

// Floating highlight bar, PDF-reader style: four colour dots, plus a bin when
// you tap an existing mark. Nothing here touches the network — every action
// edits local state and waits for Save (see HighlightSaveBar).
//
// Mobile is the primary case, which drives four decisions:
//  • `selectionchange` (not mouseup) is what fires when Android's selection
//    handles are dragged, debounced past the drag so the bar does not chase
//    the thumb.
//  • Android draws its own Copy/Share bar ABOVE the selection, so ours goes
//    BELOW by default and flips above only when there is no room.
//  • Scrolling repositions the bar rather than hiding it — Android nudges the
//    page while selecting, and hiding would make it vanish as it appeared.
//  • The bar is dots-only, so it fits a 360px screen with room to spare, and
//    every dot is a 34px touch target.

const SETTLE_MS = 320          // let Android's handles settle before showing

export default function HighlightBar() {
  const { add, remove, recolor, color, setColor, canHighlight } = useHighlights()
  const [bar, setBar] = useState(null)   // { x, y, above, mode, uid, anchors|ids }
  const barRef = useRef(null)
  const timer = useRef(null)
  // How to re-measure what the bar points at, so a scroll can reposition it.
  const measure = useRef(null)

  useEffect(() => {
    const hide = () => { measure.current = null; setBar(null) }

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
        const anchors = selectionToAnchors(sel)
        if (!anchors.length) return hide()
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        if (!rect.width && !rect.height) return hide()
        measure.current = () => {
          const s2 = window.getSelection()
          if (!s2 || s2.isCollapsed || !s2.rangeCount) return null
          return s2.getRangeAt(0).getBoundingClientRect()
        }
        place(rect, { mode: 'add', uid: root.getAttribute('data-hl-root'), anchors })
      }, SETTLE_MS)
    }

    // Tap/click straight on an existing mark → recolour or remove it.
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
        mode: 'edit',
        uid: root.getAttribute('data-hl-root'),
        ids: mark.getAttribute('data-hl-ids').split(','),
        current: mark.getAttribute('data-hl-color'),
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

  const close = () => {
    window.getSelection()?.removeAllRanges()
    measure.current = null
    setBar(null)
  }

  // pointerdown, not click: on Android a click would first dismiss the
  // selection, and the range would be gone by the time the handler ran.
  const pick = (c) => (e) => {
    e.preventDefault(); e.stopPropagation()
    setColor(c)
    if (bar.mode === 'add') add(bar.uid, bar.anchors, c)
    else recolor(bar.uid, bar.ids, c)
    close()
  }

  const del = (e) => {
    e.preventDefault(); e.stopPropagation()
    remove(bar.uid, bar.ids)
    close()
  }

  const active = bar.mode === 'add' ? color : bar.current

  return createPortal(
    <div
      ref={barRef}
      className="hl-bar"
      style={{ left: bar.x, top: bar.y, transform: `translate(-50%, ${bar.above ? '-100%' : '0'})` }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {COLORS.map(c => (
        <button
          key={c}
          type="button"
          className={`hl-swatch hl-c-${c}${active === c ? ' on' : ''}`}
          aria-label={`Highlight ${c}`}
          onPointerDown={pick(c)}
        />
      ))}
      {bar.mode === 'edit' && (
        <>
          <span className="hl-bar-sep" />
          <button type="button" className="hl-bar-del" aria-label="Remove highlight" onPointerDown={del}>
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>,
    document.body
  )
}
