import { GraduationCap, Landmark, Server } from 'lucide-react'
import { TOPICS } from '../index.js'
import MANIFEST from '../_manifest.json'

// Viva module. Counts bundled; `questions` load from Supabase into
// VIVA_DATA[slug].questions (see contentLoader.js).
// Item shape: { id, q, tags, answer:{ summary[], points[], diagram?, table?, mnemonic? } }
const COUNTS = MANIFEST.viva || {}

export const VIVA_DATA = Object.fromEntries(
  Object.keys(COUNTS).map(slug => [slug, { category: slug, questions: [] }])
)

// Categories that exist only in the Viva module (no MCQ counterpart).
const VIVA_ONLY_TOPICS = [
  { id: 'datacenter',        name: 'Data Center & DR', shortName: 'Data Center', icon: Server,        color: '#0ea5e9', questions: [] },
  { id: 'banking',           name: 'Banking & Fintech', shortName: 'Banking',    icon: Landmark,      color: '#f59e0b', questions: [] },
  { id: 'general_knowledge', name: 'General Knowledge', shortName: 'GK',          icon: GraduationCap, color: '#22c55e', questions: [] },
]

export const VIVA_TOPICS = [...TOPICS, ...VIVA_ONLY_TOPICS]
  .map(t => ({ ...t, module: 'viva', vivaCount: COUNTS[t.id] || 0 }))
  .filter(t => t.vivaCount > 0)

export function getVivaData(topicId) {
  return VIVA_DATA[topicId] || { category: topicId, questions: [] }
}
export function getVivaCount(topicId) {
  return COUNTS[topicId] || 0
}
