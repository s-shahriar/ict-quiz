import { ServerCog } from 'lucide-react'

import { TOPICS } from '../index.js'
import computerFundamental from './computer_fundamental.json'
import operatingSystem from './operating_system.json'
import linux from './linux.json'
import dsa from './dsa.json'
import computerNetwork from './computer_network.json'
import informationSecurity from './information_security.json'
import softwareEngineering from './software_engineering.json'
import database from './database.json'
import oop from './oop.json'
import server from './server.json'

const EXTRA_DATA = {
  computer_fundamental: computerFundamental,
  operating_system: operatingSystem,
  linux: linux,
  dsa: dsa,
  computer_network: computerNetwork,
  information_security: informationSecurity,
  software_engineering: softwareEngineering,
  database: database,
  oop: oop,
  server: server,
}

// Categories that exist only in the Extra module (no MCQ counterpart in TOPICS).
const EXTRA_ONLY_TOPICS = [
  {
    id: 'server',
    name: 'Server',
    shortName: 'Server',
    icon: ServerCog,
    color: '#2dd4bf',
    questions: [],
  },
]

// Single source of truth for Extra categories: MCQ topics + extra-only ones,
// keeping only those that actually have extra questions.
export const EXTRA_TOPICS = [...TOPICS, ...EXTRA_ONLY_TOPICS]
  .map(t => ({ ...t, extraCount: getExtraCount(t.id) }))
  .filter(t => t.extraCount > 0)

export function getExtraData(topicId) {
  return EXTRA_DATA[topicId] || { category: topicId, questions: [] }
}

export function getExtraCount(topicId) {
  return EXTRA_DATA[topicId]?.questions?.length || 0
}
