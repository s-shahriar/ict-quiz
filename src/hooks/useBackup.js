import { useCallback } from 'react'
import { generateCypher, parseCypher } from '../lib/backup.js'
import { TOPICS } from '../data/index.js'
import { getWrittenData, getWrittenCount } from '../data/written/index.js'

const WRITTEN_TOPICS = TOPICS
  .map(t => ({ ...t, writtenCount: getWrittenCount(t.id) }))
  .filter(t => t.writtenCount > 0)

const WRITTEN_TLIST = WRITTEN_TOPICS.map(t => {
  const data = getWrittenData(t.id)
  return { id: t.id, questions: data.questions || [] }
})

export default function useBackup() {
  const exportBackup = useCallback((mastered, important, writtenMastered) => {
    return generateCypher(mastered, important, writtenMastered, TOPICS, WRITTEN_TLIST)
  }, [])

  const importBackup = useCallback((code) => {
    return parseCypher(code, TOPICS, WRITTEN_TLIST)
  }, [])

  return { exportBackup, importBackup }
}
