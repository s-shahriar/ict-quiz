import { Terminal } from 'lucide-react'

import linux from './linux.json'

const PRACTICE_DATA = {
  linux: linux,
}

const META = {
  linux: { icon: Terminal, color: '#86efac' },
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

// Normalize a command for comparison: trim + collapse internal whitespace.
export function normalizeCommand(s) {
  return (s || '').trim().replace(/\s+/g, ' ')
}

// Check whether a user's answer matches any accepted command.
export function checkAnswer(input, accept) {
  const norm = normalizeCommand(input)
  return (accept || []).some(a => normalizeCommand(a) === norm)
}
