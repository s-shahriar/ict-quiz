const KEY = import.meta.env.VITE_API_KEY
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }

export async function fetchRemote() {
  try {
    const res = await fetch('/api/sync', { headers })
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

export function pushRemote(mastered, theme, important) {
  fetch('/api/sync', {
    method: 'POST',
    headers,
    body: JSON.stringify({ mastered: [...mastered], theme, important: [...(important ?? [])] }),
  }).catch(() => {})
}
