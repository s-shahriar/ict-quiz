import { segmentsFor } from '../../lib/textAnchor.js'
import { DEFAULT_COLOR } from '../../lib/highlightSync.js'

// Renders one block of answer text, splitting it into <mark> spans wherever the
// user has highlighted. The wrapper carries `data-hl-block` so a live selection
// can be converted back into (block, start, end) — see lib/textAnchor.js.
//
// `as` lets a block keep whatever element it already used (<p>, <span>, <td>,
// <pre>), so adding highlighting changed no layout or styling anywhere.
export default function HighlightableText({ text, block, highlights, as: Tag = 'span', ...rest }) {
  const s = text == null ? '' : String(text)
  const segs = highlights?.length ? segmentsFor(s, highlights) : null

  // One segment means either nothing is highlighted, or ONE highlight covers the
  // whole block — so test for the mark, not the count. Testing the count dropped
  // every whole-line highlight: it rendered as plain text, which left no <mark>
  // to tap, so the highlight could not be removed or even seen, and each retry
  // saved another invisible duplicate row.
  if (!segs || (segs.length === 1 && !segs[0].ids)) {
    return <Tag data-hl-block={block} {...rest}>{s}</Tag>
  }
  return (
    <Tag data-hl-block={block} {...rest}>
      {segs.map((seg, i) => seg.ids
        ? <mark
            key={i}
            className={`hl-mark hl-c-${seg.color || DEFAULT_COLOR}`}
            data-hl-ids={seg.ids.join(',')}
            data-hl-color={seg.color || DEFAULT_COLOR}
          >{seg.text}</mark>
        : <span key={i}>{seg.text}</span>)}
    </Tag>
  )
}
