const PREFIX = 'ICT'

function buildTopicList(topics) {
  return topics.map(t => ({ id: t.id, len: t.questions.length }))
}

function encodeSet(set, tList) {
  const entries = []
  tList.forEach((t, tIdx) => {
    const byteLen = Math.ceil(t.len / 8)
    const bytes = new Uint8Array(byteLen)
    let any = false
    for (let i = 0; i < t.len; i++) {
      if (set.has(`${t.id}__${i}`)) { bytes[i >> 3] |= 1 << (i & 7); any = true }
    }
    if (any) entries.push([tIdx, bytes])
  })
  const buf = new Uint8Array(1 + entries.reduce((s, [, b]) => s + 2 + b.length, 0))
  buf[0] = entries.length
  let pos = 1
  for (const [tIdx, bytes] of entries) {
    buf[pos++] = tIdx; buf[pos++] = bytes.length
    buf.set(bytes, pos); pos += bytes.length
  }
  return buf
}

function decodeSet(buf, tList) {
  const result = []
  if (!buf || buf.length < 1) return result
  const numEntries = buf[0]
  let pos = 1
  for (let e = 0; e < numEntries; e++) {
    if (pos + 1 >= buf.length) break
    const tIdx = buf[pos++]
    const byteLen = buf[pos++]
    const bytes = buf.slice(pos, pos + byteLen)
    pos += byteLen
    const topic = tList[tIdx]
    if (!topic) continue
    for (let i = 0; i < topic.len; i++) {
      if (bytes[i >> 3] & (1 << (i & 7))) result.push(`${topic.id}__${i}`)
    }
  }
  return result
}

export function generateCypher(mastered, important, topics) {
  const tList = buildTopicList(topics)
  const nBuf = encodeSet(mastered, tList)
  const iBuf = encodeSet(important, tList)
  const combined = new Uint8Array(2 + nBuf.length + iBuf.length)
  combined[0] = (nBuf.length >> 8) & 0xff
  combined[1] = nBuf.length & 0xff
  combined.set(nBuf, 2); combined.set(iBuf, 2 + nBuf.length)
  const b64 = btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${PREFIX}:${b64}`
}

export function parseCypher(cypher, topics) {
  const text = cypher.trim()
  if (!text.startsWith(`${PREFIX}:`)) throw new Error('This backup code is not for ICT Quiz')
  try {
    const raw = text.slice(PREFIX.length + 1)
    // Backward-compat: detect old JSON format
    try {
      const json = JSON.parse(atob(raw))
      if (Array.isArray(json.n) && Array.isArray(json.i)) return { nailed: json.n, important: json.i }
    } catch {}
    // New compact binary format
    const binary = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
    const combined = Uint8Array.from(binary, c => c.charCodeAt(0))
    const nLen = (combined[0] << 8) | combined[1]
    const tList = buildTopicList(topics)
    return {
      nailed:    decodeSet(combined.slice(2, 2 + nLen), tList),
      important: decodeSet(combined.slice(2 + nLen), tList),
    }
  } catch (e) {
    if (e.message.includes('not for')) throw e
    throw new Error('Invalid or corrupted backup code')
  }
}
