import { segmentsFor } from '../../lib/textAnchor.js'

// Renders one block of answer text, splitting it into <mark> spans wherever the
// user has highlighted. The wrapper carries `data-hl-block` so a live selection
// can be converted back into (block, start, end) — see lib/textAnchor.js.
//
// `as` lets a block keep whatever element it already used (<p>, <span>, <td>,
// <pre>), so adding highlighting changed no layout or styling anywhere.
export default function HighlightableText({ text, block, highlights, as: Tag = 'span', ...rest }) {
  const s = text == null ? '' : String(text)
  const segs = highlights?.length ? segmentsFor(s, highlights) : null

  if (!segs || segs.length === 1) {
    return <Tag data-hl-block={block} {...rest}>{s}</Tag>
  }
  return (
    <Tag data-hl-block={block} {...rest}>
      {segs.map((seg, i) => seg.ids
        ? <mark key={i} className="hl-mark" data-hl-ids={seg.ids.join(',')}>{seg.text}</mark>
        : <span key={i}>{seg.text}</span>)}
    </Tag>
  )
}
