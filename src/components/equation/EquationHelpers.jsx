import katex from 'katex'
import { Lightbulb } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import HighlightableText from '../shared/HighlightableText.jsx'
import { DEFAULT_COLOR } from '../../lib/highlightSync.js'

// Cover-and-recall study mode (ported from general-quiz's math formula route).
// When ON, every equation row hides its answer (RHS + note) while the name and
// LHS stay visible as the cue; tap a row to reveal it, tap again to re-cover.
const CoverCtx = createContext(false)
export const CoverProvider = CoverCtx.Provider
export const useCover = () => useContext(CoverCtx)

export function Tex({ children }) {
  const html = useMemo(
    () => katex.renderToString(String(children), { throwOnError: false }),
    [children],
  )
  return <span className="eq-tex" dangerouslySetInnerHTML={{ __html: html }} />
}

// Highlight block keys hang off the equation's name / the symbol itself rather
// than an array index, so adding or reordering rows never moves a saved mark.
//
// A formula is KaTeX markup, not a plain string, so character offsets mean
// nothing inside it: any highlight on the formula block marks the whole formula.
export function EqRow({ eq, hl }) {
  const covered = useCover()
  const [revealed, setRevealed] = useState(false)
  // Re-hide on each (re)entry to cover mode for a fresh recall pass.
  useEffect(() => { if (covered) setRevealed(false) }, [covered])
  const hide = covered && !revealed
  const flip = (e) => {
    // Re-covering must not fire from a tap on a mark or the end of a drag-select.
    if (!hide && e?.target?.closest?.('.hl-mark')) return
    const sel = window.getSelection()
    if (!hide && sel && !sel.isCollapsed && e?.currentTarget?.contains(sel.anchorNode)) return
    setRevealed(v => !v)
  }

  const key = `eq:${eq.name}`
  const marks = hl(`${key}.formula`)
  const formula = (
    <>
      <Tex>{`${eq.lhs} ${eq.rel || '='}`}</Tex>{' '}
      <span className="eq-rhs"><Tex>{eq.rhs}</Tex></span>
    </>
  )

  return (
    <div
      className={`eq-row${hide ? ' eq-covered' : ''}`}
      onClick={covered ? flip : undefined}
      onKeyDown={covered ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevealed(v => !v) }
      } : undefined}
      role={covered ? 'button' : undefined}
      tabIndex={covered ? 0 : undefined}
      title={covered ? (hide ? 'দেখতে ট্যাপ করুন' : 'আবার ঢাকতে ট্যাপ করুন') : undefined}
    >
      <HighlightableText className="eq-row-name" block={`${key}.name`} text={eq.name} highlights={hl(`${key}.name`)} />
      <span className="eq-row-formula" data-hl-block={`${key}.formula`}>
        {marks?.length ? (
          <mark
            className={`hl-mark eq-hl-formula hl-c-${marks[0].color || DEFAULT_COLOR}`}
            data-hl-ids={marks.map(h => h.id).join(',')}
            data-hl-color={marks[0].color || DEFAULT_COLOR}
          >{formula}</mark>
        ) : formula}
      </span>
      {eq.note && (
        <HighlightableText className="eq-row-note" block={`${key}.note`} text={eq.note} highlights={hl(`${key}.note`)} />
      )}
    </div>
  )
}

export function Symbols({ items, hl }) {
  return (
    <dl className="eq-symbols">
      {items.map(([sym, meaning]) => (
        <div key={sym} className="eq-symbol">
          <dt><Tex>{sym}</Tex></dt>
          <HighlightableText as="dd" block={`sym:${sym}`} text={meaning} highlights={hl(`sym:${sym}`)} />
        </div>
      ))}
    </dl>
  )
}

export function Mem({ children }) {
  return (
    <div className="eq-mem">
      <Lightbulb size={14} />
      {children}
    </div>
  )
}
