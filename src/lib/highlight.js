import Prism from 'prismjs'
import 'prismjs/components/prism-clike.js'
import 'prismjs/components/prism-c.js'
import 'prismjs/components/prism-cpp.js'
import 'prismjs/components/prism-java.js'
import 'prismjs/components/prism-sql.js'

const LANG_ALIASES = { c: 'c', cpp: 'cpp', 'c++': 'cpp', java: 'java', sql: 'sql' }

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Returns syntax-highlighted HTML (Prism `.token.*` spans) for a code string.
// Falls back to escaped plain text when the language isn't recognized, so an
// unexpected codeLang value (or none) never breaks rendering.
export function highlightCode(code, lang) {
  const key = LANG_ALIASES[(lang || 'c').toLowerCase()]
  const grammar = key && Prism.languages[key]
  if (!grammar) return escapeHtml(code)
  return Prism.highlight(code, grammar, key)
}

// The same highlighting as flat runs of plain text, each with its Prism classes
// ("token keyword", "token string"…). Used where the text must stay a sequence
// of plain text nodes — an MCQ code listing is also highlightable by the user,
// and its selection offsets are counted over textContent, which the runs keep
// exactly (they only wrap, never add or drop a character).
export function tokenRuns(code, lang) {
  const key = LANG_ALIASES[(lang || 'c').toLowerCase()]
  const grammar = key && Prism.languages[key]
  if (!grammar) return [{ text: code, cls: '' }]
  const out = []
  const walk = (t, cls) => {
    if (typeof t === 'string') { if (t) out.push({ text: t, cls }); return }
    if (Array.isArray(t)) { t.forEach(x => walk(x, cls)); return }
    const alias = t.alias ? ' ' + [].concat(t.alias).join(' ') : ''
    walk(t.content, `${cls ? cls + ' ' : ''}token ${t.type}${alias}`)
  }
  walk(Prism.tokenize(code, grammar), '')
  return out
}

// A best guess at a listing's language when the data doesn't name one: MCQ
// listings carry no codeLang. Anything C-like falls through to C, whose
// grammar also reads pseudocode and Java/C++ snippets sensibly.
export function guessLang(code) {
  if (!/[{}]/.test(code) && /\b(select\s[\s\S]*\sfrom|insert\s+into|update\s+\w+\s+set|create\s+table|delete\s+from)\b/i.test(code)) return 'sql'
  if (/\bSystem\.out\b|\bpublic\s+(static\s+)?(class|void)\b|\bString\[\]/.test(code)) return 'java'
  if (/\bcout\b|\bcin\b|#include\s*<iostream>|\bstd::|\btemplate\s*</.test(code)) return 'cpp'
  return 'c'
}
