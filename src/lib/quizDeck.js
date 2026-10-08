// A quiz deck that covers every question in the pool exactly once.
//
// The order is seeded: each question gets a rank from (seed, row id), so
// rebuilding the pool — a re-render, a re-fetch, a reload — gives the same
// order, and removing one question never moves the others. The seed, the
// deck and the position are kept in sessionStorage, so a reload or a mobile
// browser discarding the tab resumes the same quiz instead of reshuffling it
// (which showed some questions twice and never showed others).

const KEY = (quizKey) => 'quiz:' + quizKey

function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}

const rank = (seed, id) => hash(seed + ':' + id)

export const newSeed = () => Math.floor(Math.random() * 2 ** 31).toString(36)

// Exact copies (duplicate rows: same uid, options and answer) count once.
// Questions that only share a stem have different options and all stay.
export function dedupeCopies(list, uidOf) {
  const seen = new Set()
  return list.filter(q => {
    const k = uidOf(q) + '\u0000' + JSON.stringify(q.options) + '\u0000' + q.correct_answer
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function orderDeck(list, seed) {
  return list
    .map(q => [rank(seed, String(q._id)), q])
    .sort((a, b) => a[0] - b[0] || String(a[1]._id).localeCompare(String(b[1]._id)))
    .map(x => x[1])
}

export function loadSession(quizKey) {
  try { return JSON.parse(sessionStorage.getItem(KEY(quizKey))) || null } catch { return null }
}

export function saveSession(quizKey, s) {
  try { sessionStorage.setItem(KEY(quizKey), JSON.stringify(s)) } catch { /* private mode: no resume */ }
}

export function clearSession(quizKey) {
  try { sessionStorage.removeItem(KEY(quizKey)) } catch { /* ignore */ }
}

// The saved deck mapped back onto the current rows. Questions deleted since
// are dropped, and the position follows the question you were on (not the
// raw index), so a deletion earlier in the deck can't make it skip one.
export function restoreDeck(saved, pool) {
  if (!saved?.ids?.length) return null
  const byId = new Map(pool.map(q => [String(q._id), q]))
  const list = saved.ids.map(id => byId.get(String(id))).filter(Boolean)
  if (!list.length) return null
  let idx = saved.cur != null ? list.findIndex(q => String(q._id) === String(saved.cur)) : -1
  if (idx < 0) idx = Math.min(saved.idx || 0, list.length - 1)
  return { list, idx }
}
