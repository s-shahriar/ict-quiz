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
  // Every form used by a practice drill — so a curated snippet that merely
  // repeats a drill's command is dropped (the drill card shows it better, with
  // its question and explanation).
  const practiceForms = new Set()
  practice.forEach(p => {
    const primary = p.accept?.[0]
    if (!primary) return
    const forms = (p.answers && p.answers.length) ? p.answers : [primary]
    forms.forEach(f => practiceForms.add(normalizeCommand(f)))
  })

  const list = []
  // Curated command snippets: one card each, deduped, and skipped when they
  // duplicate a practice drill's command.
  const seenCmd = new Set()
  commands.forEach(c => {
    if (!c.cmd) return
    const key = normalizeCommand(c.cmd)
    if (seenCmd.has(key) || practiceForms.has(key)) return
    seenCmd.add(key)
    list.push({ cmds: [c.cmd], desc: c.desc || '', prompt: '', key: c.cmd })
  })
  // Each practice drill becomes ONE card. A drill may list several equally-valid
  // forms in `answers` (e.g. subquery vs JOIN); they're shown together under the
  // single question rather than as separate duplicate cards. Bookmarking keys
  // off the drill's primary accepted answer so it stays in sync with the
  // Practice tab.
  const seenDrill = new Set()
  practice.forEach(p => {
    const primary = p.accept?.[0]
    if (!primary) return
    const key = normalizeCommand(primary)
    if (seenDrill.has(key)) return
    seenDrill.add(key)
    const forms = (p.answers && p.answers.length) ? p.answers : [primary]
    list.push({ cmds: forms, desc: p.explain || '', prompt: p.prompt || '', key: primary })
  })
  return list
}

// Namespaced "important" id for practice, keyed by the (normalized) command
// string — prefixed "practice__" so it never collides with the written
// ("written__") or mcq ("topic__index") sets. Keying by command (not drill
// index) links a drill to its command card: marking it in the Practice tab
// also marks it in the Commands tab, and vice versa.
export function practiceCmdId(category, topic, cmd) {
  // Normalize the key the same way the category matches answers, so a drill and
  // its Commands-tab card resolve to one id even when formatted differently
  // (e.g. SQL's single-line accept[0] vs the multi-line answers[0]). Without
  // this, SQL's case/spacing/newline differences would break the link.
  const lower = category === 'sql'
  return `practice__${category}__${topic}__${normalizeCommand(cmd, { lower })}`
}
