import { segmentsFor } from '../../lib/textAnchor.js'
import { DEFAULT_COLOR } from '../../lib/highlightSync.js'
import { tokenRuns } from '../../lib/highlight.js'

// The token-coloured pieces of text[start, end): plain text nodes inside
// spans, so textContent — and every saved highlight offset — is unchanged.
function painted(runs, start, end) {
  if (!runs) return null
  const out = []
  let at = 0
  for (const r of runs) {
    const a = Math.max(start, at), b = Math.min(end, at + r.text.length)
    if (a < b) out.push(r.cls ? <span key={at} className={r.cls}>{r.text.slice(a - at, b - at)}</span> : r.text.slice(a - at, b - at))
    at += r.text.length
    if (at >= end) break
  }
  return out
}

// Renders one block of answer text, splitting it into <mark> spans wherever the
// user has highlighted. The wrapper carries `data-hl-block` so a live selection
// can be converted back into (block, start, end) — see lib/textAnchor.js.
//
// `as` lets a block keep whatever element it already used (<p>, <span>, <td>,
// <pre>), so adding highlighting changed no layout or styling anywhere.
//
// `lang` marks the block as source code: it is syntax-coloured as well, with
// the token spans nested inside the highlight segments.
export default function HighlightableText({ text, block, highlights, lang, as: Tag = 'span', ...rest }) {
  const s = text == null ? '' : String(text)
  const segs = highlights?.length ? segmentsFor(s, highlights) : null
  const runs = lang ? tokenRuns(s, lang) : null

  // One segment means either nothing is highlighted, or ONE highlight covers the
  // whole block — so test for the mark, not the count. Testing the count dropped
  // every whole-line highlight: it rendered as plain text, which left no <mark>
  // to tap, so the highlight could not be removed or even seen, and each retry
  // saved another invisible duplicate row.
  if (!segs || (segs.length === 1 && !segs[0].ids)) {
    return <Tag data-hl-block={block} {...rest}>{runs ? painted(runs, 0, s.length) : s}</Tag>
  }
  let at = 0
  return (
    <Tag data-hl-block={block} {...rest}>
      {segs.map((seg, i) => {
        const start = at
        at += seg.text.length
        const body = runs ? painted(runs, start, at) : seg.text
        return seg.ids
        ? <mark
            key={i}
            className={`hl-mark hl-c-${seg.color || DEFAULT_COLOR}`}
            data-hl-ids={seg.ids.join(',')}
            data-hl-color={seg.color || DEFAULT_COLOR}
          >{body}</mark>
        : <span key={i}>{body}</span>
      })}
    </Tag>
  )
}
