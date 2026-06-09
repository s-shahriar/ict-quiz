import { Terminal, Database } from 'lucide-react'

import linux from './linux.json'
import sql from './sql.json'

const PRACTICE_DATA = {
  linux: linux,
  sql: sql,
}

const META = {
  linux: { icon: Terminal, color: '#86efac' },
  sql: { icon: Database, color: '#93c5fd' },
}

// Single source of truth for Practice categories.
export const PRACTICE_CATEGORIES = Object.values(PRACTICE_DATA).map(c => ({
  id: c.category,
  name: c.name,
  topicCount: c.topics?.length || 0,
  icon: META[c.category]?.icon || Terminal,
  color: META[c.category]?.color || '#86efac',
}))

export function getPracticeData(categoryId) {
  return PRACTICE_DATA[categoryId] || null
}

// Normalize a command for comparison: trim, collapse internal whitespace, and
// drop a trailing semicolon (harmless for shell, forgiving for SQL). Pass
// { lower: true } to also lowercase — used for case-insensitive languages (SQL).
export function normalizeCommand(s, { lower = false } = {}) {
  const v = (s || '').trim().replace(/\s+/g, ' ').replace(/\s*;+\s*$/, '')
  return lower ? v.toLowerCase() : v
}

// Check whether a user's answer matches any accepted command.
// caseInsensitive: true compares case-insensitively (SQL keywords/identifiers).
export function checkAnswer(input, accept, { caseInsensitive = false } = {}) {
  const norm = normalizeCommand(input, { lower: caseInsensitive })
  return (accept || []).some(a => normalizeCommand(a, { lower: caseInsensitive }) === norm)
}
