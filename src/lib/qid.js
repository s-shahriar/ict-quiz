// Stable, module-scoped question identity. Same rationale as general-quiz:
// identity is a hash of the item's text, NOT its array position — so deleting or
// reordering never shifts another item's saved nailed/important flag.
//
// Module-scoped (`mcq:` / `written:` / `extra:` / `viva:` / `practice:`) because
// the same text can legitimately appear in different modules as different items.
//
// Dependency-free ESM: imported by the Vite app AND the Node seed so the uid
// computed in the browser always matches the uid stored in the database.

export function normalizeQ(s) {
  return (s ?? '')
    .toString()
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

// uid for a module + text (e.g. uidFor('mcq', q.question), uidFor('written', q.q),
// uidFor('practice', command)). Returns null for empty text.
export function uidFor(module, text) {
  const norm = normalizeQ(text)
  if (!norm) return null
  return `${module}:${cyrb53(norm).toString(36)}`
}
