import { TOPICS } from '../index.js'
import computer_network from './computer_network.js'
import operating_system from './operating_system.js'

// Equation module. Content is bundled (like Practice), not served from Supabase:
// each category is a JS file of formula groups, keyed by the MCQ topic id so it
// inherits that topic's name, icon and colour.

const EQUATION_DATA = {
  computer_network,
  operating_system,
}

const countEquations = (data) =>
  data.groups.reduce((n, g) => n + g.equations.length, 0)

export const EQUATION_TOPICS = TOPICS
  .filter(t => EQUATION_DATA[t.id])
  .map(t => ({
    ...t,
    module: 'equation',
    groupCount: EQUATION_DATA[t.id].groups.length,
    equationCount: countEquations(EQUATION_DATA[t.id]),
  }))

export function getEquationData(topicId) {
  return EQUATION_DATA[topicId] || null
}
