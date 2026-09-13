// Written/Extra/Viva/Code question text.
//
// Most questions are one paragraph and render as one. Some carry structured
// data — a routing table, tracert output, firewall rules, a list of (a)/(b)/(c)
// sub-questions — and cramming that onto one line is unreadable. The convention
// in the data is: blank line separates blocks, and a line indented by 2+ spaces
// is a list item.
//
// `white-space: pre-wrap` alone is not enough. It keeps the newlines but a
// wrapped item falls back to the left margin, so a long sub-question loses the
// indent halfway through. Emitting each item as its own element lets CSS give it
// a real hanging indent that survives wrapping at any width, which matters most
// on narrow screens where nearly every item wraps.
//
// Alignment is never attempted across columns: this text renders in Inter, a
// proportional font, so spaces do not form columns. One item per line.

import HighlightableText from './HighlightableText.jsx'
import { useHighlights } from '../../contexts/HighlightContext.jsx'
import { guardHighlightClick } from '../../lib/textAnchor.js'

const INDENTED = /^\s{2,}\S/

export function splitQuestionBlocks(text) {
  const blocks = []
  for (const raw of String(text ?? '').split('\n')) {
    if (!raw.trim()) {
      if (blocks.length && blocks[blocks.length - 1].kind !== 'gap') blocks.push({ kind: 'gap' })
      continue
    }
    blocks.push({ kind: INDENTED.test(raw) ? 'item' : 'para', text: raw.trim() })
  }
  while (blocks.length && blocks[blocks.length - 1].kind === 'gap') blocks.pop()
  return blocks
}

export default function WrittenQuestionText({ text, uid, className, style }) {
  const blocks = splitQuestionBlocks(text)
  const { getFor } = useHighlights()

  // Given a uid, the question is highlightable exactly like its answer: this
  // wrapper is the root and each line is its own block — 'q' for a one-line
  // question, 'q.N' otherwise. The uid is a hash of this very text, so a wording
  // change starts a fresh set of marks rather than misplacing old ones.
  const all = uid ? getFor(uid) : null
  const hl = (key) => all?.length ? all.filter(h => h.block === key) : undefined
  const root = uid ? { 'data-hl-root': uid, onClick: guardHighlightClick } : {}

  // The common case — a single paragraph — stays one inline run so nothing about
  // the existing layout shifts.
  if (blocks.length <= 1) {
    return (
      <span className={className} style={style} {...root}>
        <HighlightableText block="q" text={blocks[0]?.text ?? ''} highlights={hl('q')} />
      </span>
    )
  }

  return (
    <span className={className} style={style} {...root}>
      {blocks.map((b, i) =>
        b.kind === 'gap'
          ? <span key={i} className="wq-gap" />
          : <HighlightableText key={i} className={b.kind === 'item' ? 'wq-item' : 'wq-para'}
              block={`q.${i}`} text={b.text} highlights={hl(`q.${i}`)} />
      )}
    </span>
  )
}
