// Anchoring for PDF-style highlights.
//
// A highlight is stored as (question uid, block key, start, end, quote) rather
// than as a DOM range, because the DOM is rebuilt on every render and the answer
// payload itself gets edited over time.
//
//   block key  — where the text lives inside the answer, e.g. 'summary.1',
//                'points.7', 'table.r2.c1', 'mnemonic'. Built by the renderer,
//                so it is the same in every browser.
//   start/end  — character offsets into that block's plain text.
//   quote      — the exact selected text, kept so the highlight can survive a
//                small content edit that shifts the offsets.
//
// Re-anchoring: if the offsets no longer point at `quote`, look for `quote` in
// the block. A single unambiguous occurrence wins and the highlight moves there.
// Anything else (missing, or appearing more than once) is treated as orphaned:
// it is NOT rendered and NOT deleted, so a wording change never silently
// destroys the user's marks — restoring the wording brings them back.

export const ORPHAN = -1

// Resolve one stored highlight against the block text as it exists right now.
// Returns { start, end } or null when it cannot be placed.
export function resolveAnchor(blockText, h) {
  if (typeof blockText !== 'string' || !h?.quote) return null
  if (blockText.slice(h.start, h.end) === h.quote) return { start: h.start, end: h.end }
  const first = blockText.indexOf(h.quote)
  if (first === ORPHAN) return null
  if (blockText.indexOf(h.quote, first + 1) !== ORPHAN) return null   // ambiguous
  return { start: first, end: first + h.quote.length }
}

// Turn a list of stored highlights into non-overlapping, sorted ranges for one
// block. Overlaps are merged so two marks that touch render as one continuous
// band (what a PDF reader does) — `ids` keeps every highlight the band came
// from, so removing or recolouring it applies to all of them. A merged band
// takes the colour of its earliest highlight; picking a colour on it repaints
// the whole band, which is the only unambiguous thing it can mean.
export function rangesFor(blockText, highlights) {
  const placed = []
  for (const h of highlights) {
    const r = resolveAnchor(blockText, h)
    if (r) placed.push({ ...r, ids: [h.id], color: h.color })
  }
  if (!placed.length) return []
  placed.sort((a, b) => a.start - b.start || a.end - b.end)
  const merged = [placed[0]]
  for (const r of placed.slice(1)) {
    const last = merged[merged.length - 1]
    if (r.start <= last.end) {
      last.end = Math.max(last.end, r.end)
      last.ids.push(...r.ids)
    } else merged.push(r)
  }
  return merged
}

// Split a block's text into [{ text, ids }] segments — ids empty for plain text.
export function segmentsFor(blockText, highlights) {
  const ranges = rangesFor(blockText, highlights)
  if (!ranges.length) return [{ text: blockText, ids: null }]
  const out = []
  let at = 0
  for (const r of ranges) {
    if (r.start > at) out.push({ text: blockText.slice(at, r.start), ids: null })
    out.push({ text: blockText.slice(r.start, r.end), ids: r.ids, color: r.color })
    at = r.end
  }
  if (at < blockText.length) out.push({ text: blockText.slice(at), ids: null })
  return out
}

// ---------------------------------------------------------------------------
// Reading a live DOM Selection back into block + offsets.

const BLOCK_ATTR = 'data-hl-block'

function blockElFor(node) {
  let el = node?.nodeType === 3 ? node.parentElement : node
  while (el && !el.hasAttribute?.(BLOCK_ATTR)) el = el.parentElement
  return el || null
}

// Character offset of `node`/`offset` within its block element's text content.
// Walks text nodes in document order, which is what textContent concatenates,
// so this stays correct even though the block is already split by <mark>s.
function offsetInBlock(blockEl, node, offset) {
  if (node === blockEl) {
    // Selection landed on the element itself: offset counts child nodes.
    let n = 0
    for (let i = 0; i < offset && i < blockEl.childNodes.length; i++) {
      n += blockEl.childNodes[i].textContent.length
    }
    return n
  }
  const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT)
  let n = 0
  while (walker.nextNode()) {
    if (walker.currentNode === node) return n + offset
    n += walker.currentNode.textContent.length
  }
  return n
}

// A selection may run across several blocks (bullet into the next bullet, or a
// whole answer dragged over). Return one {block, start, end, quote} per block it
// actually touches, exactly like a PDF highlighter does.
export function selectionToAnchors(selection) {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return []
  const range = selection.getRangeAt(0)
  if (!range.toString().trim()) return []

  const startBlock = blockElFor(range.startContainer)
  const endBlock = blockElFor(range.endContainer)
  if (!startBlock && !endBlock) return []

  // Every block that intersects the range, in document order.
  const root = startBlock?.closest('[data-hl-root]') || endBlock?.closest('[data-hl-root]')
  if (!root) return []
  const blocks = [...root.querySelectorAll(`[${BLOCK_ATTR}]`)].filter(el => range.intersectsNode(el))
  if (!blocks.length) return []

  const out = []
  for (const el of blocks) {
    const full = el.textContent
    const start = el === startBlock ? offsetInBlock(el, range.startContainer, range.startOffset) : 0
    const end = el === endBlock ? offsetInBlock(el, range.endContainer, range.endOffset) : full.length
    if (end <= start) continue
    const quote = full.slice(start, end)
    if (!quote.trim()) continue
    // Trim whitespace that the drag picked up at the edges, so the mark hugs the
    // words the way a PDF highlighter does.
    const lead = quote.length - quote.trimStart().length
    const trail = quote.length - quote.trimEnd().length
    const s = start + lead, e = end - trail
    if (e <= s) continue
    out.push({ block: el.getAttribute(BLOCK_ATTR), start: s, end: e, quote: full.slice(s, e) })
  }
  return out
}
