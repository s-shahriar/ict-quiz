import { ServerCog } from 'lucide-react'
import { TOPICS } from '../index.js'
import MANIFEST from '../_manifest.json'

// Written module. Metadata + counts are bundled (so the category list can be
// built without loading content); `questions` load from Supabase on demand into
// WRITTEN_DATA[slug].questions (see contentLoader.js).

const COUNTS = MANIFEST.written || {}

export const WRITTEN_DATA = Object.fromEntries(
  Object.keys(COUNTS).map(slug => [slug, { category: slug, questions: [] }])
)

const WRITTEN_ONLY_TOPICS = [
  { id: 'server', name: 'Server', shortName: 'Server', icon: ServerCog, color: '#2dd4bf', questions: [] },
]

export const WRITTEN_TOPICS = [...TOPICS, ...WRITTEN_ONLY_TOPICS]
  .map(t => ({ ...t, module: 'written', writtenCount: COUNTS[t.id] || 0 }))
  .filter(t => t.writtenCount > 0)

export function getWrittenData(topicId) {
  return WRITTEN_DATA[topicId] || { category: topicId, questions: [] }
}
export function getWrittenCount(topicId) {
  return COUNTS[topicId] || 0
}
