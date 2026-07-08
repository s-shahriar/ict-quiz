import { GraduationCap, Landmark, Server } from 'lucide-react'

import { TOPICS } from '../index.js'
import computerNetwork from './computer_network.json'
import database from './database.json'
import machineLearning from './machine_learning.json'
import informationSecurity from './information_security.json'
import softwareEngineering from './software_engineering.json'
import datacenter from './datacenter.json'
import banking from './banking.json'
import generalKnowledge from './general_knowledge.json'

// Viva Q&A datasets, keyed by topic id.
// To add a topic's viva questions: create ./<topic>.json, import it here,
// and register it in VIVA_DATA below. Shape mirrors the Extra module:
//   { category, questions: [{ id, q, tags, answer:{ summary[], points[], diagram?, table?, mnemonic? } }] }
const VIVA_DATA = {
  computer_network: computerNetwork,
  database: database,
  machine_learning: machineLearning,
  information_security: informationSecurity,
  software_engineering: softwareEngineering,
  datacenter: datacenter,
  banking: banking,
  general_knowledge: generalKnowledge,
}

// Categories that exist only in the Viva module (no MCQ counterpart in TOPICS).
const VIVA_ONLY_TOPICS = [
  {
    id: 'datacenter',
    name: 'Data Center & DR',
    shortName: 'Data Center',
    icon: Server,
    color: '#0ea5e9',
    questions: [],
  },
  {
    id: 'banking',
    name: 'Banking & Fintech',
    shortName: 'Banking',
    icon: Landmark,
    color: '#f59e0b',
    questions: [],
  },
  {
    id: 'general_knowledge',
    name: 'General Knowledge',
    shortName: 'GK',
    icon: GraduationCap,
    color: '#22c55e',
    questions: [],
  },
]

// Single source of truth for Viva categories: MCQ topics + viva-only ones,
// keeping only those that actually have viva questions.
export const VIVA_TOPICS = [...TOPICS, ...VIVA_ONLY_TOPICS]
  .map(t => ({ ...t, vivaCount: getVivaCount(t.id) }))
  .filter(t => t.vivaCount > 0)

export function getVivaData(topicId) {
  return VIVA_DATA[topicId] || { category: topicId, questions: [] }
}

export function getVivaCount(topicId) {
  return VIVA_DATA[topicId]?.questions?.length || 0
}
