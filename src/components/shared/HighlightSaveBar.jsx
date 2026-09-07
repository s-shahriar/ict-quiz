import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Loader2, Undo2, AlertCircle } from 'lucide-react'
import { useHighlights } from '../../contexts/HighlightContext.jsx'

// The Save pill for pending highlight edits.
//
// Highlighting is local until this is pressed, so this bar IS the sync — it is
// the only thing in the feature that talks to the network. It appears only when
// there is unsaved work, and pins to the bottom centre: every other fixed
// element in the app is anchored to the top, so nothing collides, and on a
// phone the bottom edge is the easiest place to reach with a thumb.
//
// The safe-area inset keeps it clear of the Android gesture bar.

export default function HighlightSaveBar() {
  const { dirtyCount, status, error, save, discard, canHighlight } = useHighlights()
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 1900)
    return () => clearTimeout(t)
  }, [justSaved])

  if (!canHighlight) return null
  if (!dirtyCount && !justSaved) return null

  if (!dirtyCount && justSaved) {
    return createPortal(
      <div className="hl-savebar saved"><Check size={15} /><span>Highlights saved</span></div>,
      document.body
    )
  }

  const busy = status === 'saving'
  const onSave = async () => { if (await save()) setJustSaved(true) }

  return createPortal(
    <div className={`hl-savebar${status === 'error' ? ' has-error' : ''}`}>
      {status === 'error'
        ? <><AlertCircle size={15} /><span className="hl-savebar-msg">{error || 'Save failed'}</span></>
        : <span className="hl-savebar-msg">{dirtyCount} unsaved highlight{dirtyCount > 1 ? 's' : ''}</span>}

      <button type="button" className="hl-savebar-undo" onClick={discard} disabled={busy} aria-label="Discard changes">
        <Undo2 size={15} />
      </button>
      <button type="button" className="hl-savebar-save" onClick={onSave} disabled={busy}>
        {busy ? <Loader2 size={15} className="hl-spin" /> : <Check size={15} />}
        <span>{busy ? 'Saving' : status === 'error' ? 'Retry' : 'Save'}</span>
      </button>
    </div>,
    document.body
  )
}
