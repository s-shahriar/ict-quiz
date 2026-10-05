import { TOPICS } from '../index.js'
import { useBlobsReady } from '../blobs.js'

// Equation module. Content lives in Supabase (`content_blobs`, kind 'equation'),
// one row per category keyed by the MCQ topic id, so each inherits that topic's
// name, icon and colour. The store is filled in place by `useEquationReady`
// (the diagram components themselves are still bundled).

const EQUATION_DATA = {}

const countEquations = (data) =>
  data.groups.reduce((n, g) => n + g.equations.length, 0)

// Emptied until loaded; mutated in place so importers keep the same array.
export const EQUATION_TOPICS = []

function applyEquation(rows) {
  for (const r of rows) EQUATION_DATA[r.key] = r.payload
  EQUATION_TOPICS.length = 0
  for (const t of TOPICS.filter(t => EQUATION_DATA[t.id])) {
    EQUATION_TOPICS.push({
      ...t,
      module: 'equation',
      groupCount: EQUATION_DATA[t.id].groups.length,
      equationCount: countEquations(EQUATION_DATA[t.id]),
    })
  }
}

// Ensure Equation content is loaded; the caller re-renders once it is ready.
export function useEquationReady() {
  return useBlobsReady('equation', applyEquation)
}

export function getEquationData(topicId) {
  return EQUATION_DATA[topicId] || null
}
