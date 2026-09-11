// Human-readable labels for queued writes.
//
// A question's uid is a hash of its text (see qid.js), so there is no way back
// from a uid to something a person can recognise. The sync drawer has to show
// WHICH question is waiting, so every row the content loader fetches registers
// its text here, and the queue copies the label into the entry it persists.
//
// In-memory only: it is a cache of content that is itself re-fetched on load.
// The queue keeps its own copy of the label for the handful of entries that are
// actually pending, so a reload still shows real text for them.

const MAX = 8000
const MAX_LEN = 120
// Content types differ per module: MCQs carry `question`, written/viva/code
// carry `q`, practice items carry `command`. First non-empty wins.
const TEXT_KEYS = ['question', 'q', 'title', 'term', 'word', 'command', 'name']

const labels = new Map()   // uid -> { text, cat }

// Questions are stored as HTML, so strip tags and entities before showing the
// text in a compact one-line row.
export function plainText(html, max = MAX_LEN) {
  const s = String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

// Best-effort readable text for a question object of any content type.
export function textOf(q) {
  for (const k of TEXT_KEYS) if (q?.[k]) return plainText(q[k])
  return ''
}

// `source` is either the raw text or the question object it lives on.
export function rememberQuestion(uid, source, cat) {
  if (!uid) return
  const text = typeof source === 'string' ? plainText(source) : textOf(source)
  if (!text) return
  // FIFO cap — Map preserves insertion order, so the oldest key is first.
  if (!labels.has(uid) && labels.size >= MAX) labels.delete(labels.keys().next().value)
  labels.set(uid, { text, cat: cat || labels.get(uid)?.cat || '' })
}

export function labelFor(uid) {
  return labels.get(uid) || null
}
