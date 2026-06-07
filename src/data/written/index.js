import { ServerCog } from 'lucide-react'

import { TOPICS } from '../index.js'
import computerFundamental from './computer_fundamental.json'
import operatingSystem from './operating_system.json'
import linux from './linux.json'
import dsa from './dsa.json'
import computerNetwork from './computer_network.json'
import informationSecurity from './information_security.json'
import softwareEngineering from './software_engineering.json'
import microprocessor from './microprocessor.json'
import database from './database.json'
import oop from './oop.json'
import cProgramming from './c_programming.json'
import server from './server.json'

const WRITTEN_DATA = {
  computer_fundamental: computerFundamental,
  operating_system: operatingSystem,
  linux: linux,
  dsa: dsa,
  computer_network: computerNetwork,
  information_security: informationSecurity,
  software_engineering: softwareEngineering,
  microprocessor: microprocessor,
  database: database,
  oop: oop,
  c_programming: cProgramming,
  server: server,
}

// Categories that exist only in the Written module (no MCQ counterpart in TOPICS).
const WRITTEN_ONLY_TOPICS = [
  {
    id: 'server',
    name: 'Server',
    shortName: 'Server',
    icon: ServerCog,
    color: '#2dd4bf',
    questions: [],
  },
]

// Single source of truth for Written categories: MCQ topics + written-only ones,
// keeping only those that actually have written questions.
export const WRITTEN_TOPICS = [...TOPICS, ...WRITTEN_ONLY_TOPICS]
  .map(t => ({ ...t, writtenCount: getWrittenCount(t.id) }))
  .filter(t => t.writtenCount > 0)

export function getWrittenData(topicId) {
  return WRITTEN_DATA[topicId] || { category: topicId, questions: [] }
}

export function getWrittenCount(topicId) {
  return WRITTEN_DATA[topicId]?.questions?.length || 0
}
