const PREFIX = 'ICT'

export function generateCypher(mastered, important) {
  const data = { v: 1, n: [...mastered], i: [...important] }
  return `${PREFIX}:${btoa(JSON.stringify(data))}`
}

export function parseCypher(cypher) {
  const text = cypher.trim()
  if (!text.startsWith(`${PREFIX}:`)) {
    throw new Error('This backup code is not for ICT Quiz')
  }
  try {
    const data = JSON.parse(atob(text.slice(PREFIX.length + 1)))
    if (!Array.isArray(data.n) || !Array.isArray(data.i)) throw new Error()
    return { nailed: data.n, important: data.i }
  } catch {
    throw new Error('Invalid or corrupted backup code')
  }
}
