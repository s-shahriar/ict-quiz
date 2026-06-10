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
  let v = (s || '').trim().replace(/\s+/g, ' ').replace(/\s*;+\s*$/, '')
  if (lower) {
    // SQL: spacing around operators and punctuation is insignificant, so
    // standardize it — `Project='P1'` matches `Project = 'P1'`, and
    // `mod(EmpId,2)` matches `MOD(EmpId, 2)`. Multi-char operators are listed
    // first so `<=`/`>=`/`<>`/`!=` aren't split into single chars.
    v = v.replace(/\s*(<=|>=|<>|!=|=|<|>|,|\(|\))\s*/g, ' $1 ').replace(/\s+/g, ' ').trim()
    v = v.toLowerCase()
  }
  return v
}

// Check whether a user's answer matches any accepted command.
// caseInsensitive: true compares case-insensitively (SQL keywords/identifiers).
export function checkAnswer(input, accept, { caseInsensitive = false } = {}) {
  const norm = normalizeCommand(input, { lower: caseInsensitive })
  return (accept || []).some(a => normalizeCommand(a, { lower: caseInsensitive }) === norm)
}

// Build the Commands-tab list: curated commands + each practice item's primary
// accepted answer, deduped by normalized form.
export function buildCommandList(commands = [], practice = []) {
  const seen = new Set()
  const list = []
  const add = (cmd, desc, prompt) => {
    if (!cmd) return
    const key = normalizeCommand(cmd)
    if (seen.has(key)) return
    seen.add(key)
    list.push({ cmd, desc: desc || '', prompt: prompt || '' })
  }
  commands.forEach(c => add(c.cmd, c.desc))
  // A drill may list multiple equally-valid forms in `answers` (e.g. with and
  // without `-type f`); show each so the user sees both styles. Fall back to
  // the primary accepted answer. The drill's `prompt` (the question) is carried
  // through so the Commands tab can show what each query actually answers.
  practice.forEach(p => {
    const forms = (p.answers && p.answers.length) ? p.answers : [p.accept?.[0]]
    forms.forEach(f => add(f, p.explain, p.prompt))
  })
  return list
}

// Namespaced "important" id for practice, keyed by the (normalized) command
// string — prefixed "practice__" so it never collides with the written
// ("written__") or mcq ("topic__index") sets. Keying by command (not drill
// index) links a drill to its command card: marking it in the Practice tab
// also marks it in the Commands tab, and vice versa.
export function practiceCmdId(category, topic, cmd) {
  return `practice__${category}__${topic}__${normalizeCommand(cmd)}`
}
