import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { useFloatingPopover } from './useFloatingPopover.js'

// Overflow menu for the row of per-question actions: houses the rarely-tapped
// ones (currently just Delete) behind one "⋯" trigger so the row itself only
// ever shows the flags people toggle constantly (Nail It / Important / Weak).
// Children are whatever action buttons the caller passes — each manages its
// own click behaviour and dialog.
//
// Once opened, children stay mounted (just hidden via CSS) even after this
// menu closes — closing used to unmount them outright, which raced with a
// child's own click handler opening ITS dialog: the popup closed and tore
// the child down in the same render before its dialog could ever show, so
// tapping an item in the menu could look like it did nothing.
export default function MoreMenu({ className = '', size = 14, children }) {
  const { open, pos, btnRef, popRef, toggle, close } = useFloatingPopover()

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
      {pos && createPortal(
        <div
          ref={popRef}
          className={`more-menu-pop${open ? '' : ' more-menu-pop-hidden'}`}
          role="menu"
          style={{ top: pos.top, left: pos.left, right: pos.right }}
          onClickCapture={close}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  )
}
