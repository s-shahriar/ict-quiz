import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, LogIn } from 'lucide-react'
import { selectionToAnchors, markForSelection } from '../../lib/textAnchor.js'
import { placeBar, clampX } from '../../lib/barPlacement.js'
import { COLORS } from '../../lib/highlightSync.js'
import { useHighlights } from '../../contexts/HighlightContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import LoginPrompt from '../auth/LoginPrompt.jsx'

// Floating highlight bar, PDF-reader style: four colour dots, plus a bin when
// the target is an existing mark. Nothing here touches the network — every
// action edits local state and waits for Save (see HighlightSaveBar).
//
// Mobile is the primary case, which drives these decisions:
//  • `selectionchange` (not mouseup) is what fires when Android's selection
//    handles are dragged, debounced past the drag so the bar does not chase
//    the thumb.
//  • Tapping a mark ALSO makes Android select the word under the finger. That
//    fires selectionchange, which used to replace the edit bar with the add
//    bar — the bin flashed up and vanished. Two guards stop that: a selection
//    lying inside a mark opens edit mode, and a selectionchange arriving right
//    after a deliberate tap on a mark is ignored outright.
//  • Android draws its own Copy/Share bar ABOVE the selection, so ours goes
//    BELOW by default and flips above only when there is no room.
//  • Scrolling repositions the bar rather than hiding it — Android nudges the
//    page while selecting, and hiding would make it vanish as it appeared.
//  • The bar is MEASURED after render and re-clamped horizontally. Its width
//    depends on the mode, so a guessed width let the bin hang off the edge of
//    a phone when the selected text sat near the left or right margin.

const SETTLE_MS = 320          // let Android's handles settle before showing
const TAP_GUARD_MS = 900       // ignore selectionchange right after a mark tap

export default function HighlightBar() {
  const { add, remove, recolor, color, setColor, canHighlight } = useHighlights()
  const { signInWithGoogle } = useAuth()
  const [promptLogin, setPromptLogin] = useState(false)
  const [bar, setBar] = useState(null)   // { x, y, above, mode, uid, anchors|ids }
  const barRef = useRef(null)
  const timer = useRef(null)
  const measure = useRef(null)           // how to re-measure the target on scroll
  const tappedAt = useRef(0)             // when a mark was last deliberately tapped

  useEffect(() => {
    const hide = () => { measure.current = null; setBar(null) }

    const place = (rect, payload) =>
      setBar(b => ({
        ...placeBar(rect, window.innerWidth, window.innerHeight, b?.w || 0),
        w: b?.w || 0, ...payload,
      }))

    const editFor = (mark) => {
      const root = mark.closest('[data-hl-root]')
      if (!root) return
      measure.current = () => mark.isConnected ? mark.getBoundingClientRect() : null
      place(mark.getBoundingClientRect(), {
        mode: 'edit',
        uid: root.getAttribute('data-hl-root'),
        ids: mark.getAttribute('data-hl-ids').split(','),
        current: mark.getAttribute('data-hl-color'),
      })
    }

    const reposition = () => {
      const rect = measure.current?.()
      if (!rect) return hide()
      setBar(b => b && { ...b, ...placeBar(rect, window.innerWidth, window.innerHeight, b.w) })
    }

    const onSelectionChange = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        // A tap on a mark just opened edit mode; Android's own word-selection
        // is a side effect of that tap, not a new intent.
        if (Date.now() - tappedAt.current < TAP_GUARD_MS) return

        const sel = window.getSelection()
        if (!sel || sel.isCollapsed || !sel.rangeCount) return hide()

        // Selection sitting inside an existing highlight -> edit it.
        const mark = markForSelection(sel)
        if (mark) return editFor(mark)

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

    const onPointerDown = (e) => {
      const mark = e.target.closest?.('.hl-mark')
      if (!mark) {
        if (!barRef.current?.contains(e.target)) hide()
        return
      }
      window.clearTimeout(timer.current)
      tappedAt.current = Date.now()
      editFor(mark)
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

  // Re-clamp with the bar's REAL width once it is in the DOM. The add and edit
  // bars are different widths, so this runs whenever the mode changes.
  useLayoutEffect(() => {
    if (!bar || !barRef.current) return
    const w = barRef.current.offsetWidth
    if (!w || w === bar.w) return
    const x = clampX(bar.x, w, window.innerWidth)
    setBar(b => b && { ...b, w, x })
  }, [bar?.mode, bar?.x, bar?.w])

  if (!bar && !promptLogin) return null

  // Signed out, highlighting used to do nothing at all — you selected text and
  // no bar appeared, with no way to tell whether the feature was broken or you
  // were simply logged out. It now says so and offers the same Google sign-in
  // the Nail It / Important buttons use.
  if (bar && !canHighlight) {
    return (
      <>
        {createPortal(
          <div
            ref={barRef}
            className="hl-bar hl-bar-signin"
            style={{ left: bar.x, top: bar.y, transform: `translate(-50%, ${bar.above ? '-100%' : '0'})` }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setPromptLogin(true) }}
          >
            <LogIn size={15} />
            <span>Sign in to highlight</span>
          </div>,
          document.body,
        )}
        {promptLogin && createPortal(
          <LoginPrompt onGoogle={signInWithGoogle} onClose={() => setPromptLogin(false)} />,
          document.body,
        )}
      </>
    )
  }
  if (!bar) return null

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
      style={{
        left: bar.x,
        top: bar.y,
        transform: `translate(-50%, ${bar.above ? '-100%' : '0'})`,
        // Hide the first paint until the real width has been measured and
        // clamped, so the bar never appears off-screen and then jump.
        visibility: bar.w ? 'visible' : 'hidden',
      }}
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
