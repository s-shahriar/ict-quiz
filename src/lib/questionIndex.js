import { TOPICS } from '../data/index.js'
import { normalize } from './normalize.js'

// The same MCQ question text can appear under several topics/indices, so a
// single question maps to multiple qids (`${topicId}__${index}`).
// "Important" is conceptually per-question, so we index text <-> all its qids
// to let a toggle apply to every copy (so unticking reliably clears it).
// Only MCQ qids are indexed; written/practice qids use other schemes and fall
// back to themselves.

let textToQids = null
let qidToText = null

function build() {
  textToQids = new Map()
  qidToText = new Map()
  for (const t of TOPICS) {
    t.questions.forEach((q, i) => {
      if (!q.options || !q.correct_answer) return
      const key = normalize(q.question)
      if (!key) return
      const qid = `${t.id}__${i}`
      qidToText.set(qid, key)
      if (!textToQids.has(key)) textToQids.set(key, [])
      textToQids.get(key).push(qid)
    })
  }
}

function ensure() {
  if (!textToQids) build()
}

// All qids that share the same question text as the given qid (incl. itself).
export function duplicateQidsOf(qid) {
  ensure()
  const key = qidToText.get(qid)
  if (!key) return [qid]
  return textToQids.get(key) ?? [qid]
}
