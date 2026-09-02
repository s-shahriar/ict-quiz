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
