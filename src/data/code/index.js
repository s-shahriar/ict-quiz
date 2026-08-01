import { ArrowDownUp, Brackets, Grid3x3, Sigma, Type } from 'lucide-react'
import MANIFEST from '../_manifest.json'

// Code module — exam-style Java programs. Counts bundled; `questions` load from
// Supabase into CODE_DATA[slug].questions (see contentLoader.js).
// Item shape: { id, q, tags, answer:{ code, codeLang, summary[], points[], diagram?, mnemonic } }
const COUNTS = MANIFEST.code || {}

export const CODE_DATA = Object.fromEntries(
  Object.keys(COUNTS).map(slug => [slug, { category: slug, questions: [] }])
)

// Every Code category is its own thing — none of them map to an MCQ topic, so
// the list is defined here in full rather than derived from TOPICS.
const CODE_TOPICS_ALL = [
  { id: 'array',             name: 'Array Programs',      shortName: 'Array',   icon: Brackets,    color: '#38bdf8', questions: [] },
  { id: 'string',            name: 'String Programs',     shortName: 'String',  icon: Type,        color: '#f472b6', questions: [] },
  { id: 'number',            name: 'Number Programs',     shortName: 'Number',  icon: Sigma,       color: '#fbbf24', questions: [] },
  { id: 'matrix',            name: 'Matrix Programs',     shortName: 'Matrix',  icon: Grid3x3,     color: '#a78bfa', questions: [] },
  { id: 'sorting_searching', name: 'Sorting & Searching', shortName: 'Sort',    icon: ArrowDownUp, color: '#4ade80', questions: [] },
]

export const CODE_TOPICS = CODE_TOPICS_ALL
  .map(t => ({ ...t, module: 'code', codeCount: COUNTS[t.id] || 0 }))
  .filter(t => t.codeCount > 0)

export function getCodeData(topicId) {
  return CODE_DATA[topicId] || { category: topicId, questions: [] }
}
export function getCodeCount(topicId) {
  return COUNTS[topicId] || 0
}
