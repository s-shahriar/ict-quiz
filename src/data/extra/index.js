import { ServerCog } from 'lucide-react'
import { TOPICS } from '../index.js'
import MANIFEST from '../_manifest.json'

// Extra module. Counts bundled; `questions` load from Supabase into
// EXTRA_DATA[slug].questions (see contentLoader.js).
const COUNTS = MANIFEST.extra || {}

export const EXTRA_DATA = Object.fromEntries(
  Object.keys(COUNTS).map(slug => [slug, { category: slug, questions: [] }])
)

const EXTRA_ONLY_TOPICS = [
  { id: 'server', name: 'Server', shortName: 'Server', icon: ServerCog, color: '#2dd4bf', questions: [] },
]

export const EXTRA_TOPICS = [...TOPICS, ...EXTRA_ONLY_TOPICS]
  .map(t => ({ ...t, module: 'extra', extraCount: COUNTS[t.id] || 0 }))
  .filter(t => t.extraCount > 0)

export function getExtraData(topicId) {
  return EXTRA_DATA[topicId] || { category: topicId, questions: [] }
}
export function getExtraCount(topicId) {
  return COUNTS[topicId] || 0
}
