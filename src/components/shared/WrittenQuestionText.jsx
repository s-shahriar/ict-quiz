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

export default function WrittenQuestionText({ text, className, style }) {
  const blocks = splitQuestionBlocks(text)

  // The common case — a single paragraph — stays a plain span so nothing about
  // the existing layout shifts.
  if (blocks.length <= 1) {
    return <span className={className} style={style}>{blocks[0]?.text ?? ''}</span>
  }

  return (
    <span className={className} style={style}>
      {blocks.map((b, i) =>
        b.kind === 'gap'
          ? <span key={i} className="wq-gap" />
          : <span key={i} className={b.kind === 'item' ? 'wq-item' : 'wq-para'}>{b.text}</span>
      )}
    </span>
  )
}
