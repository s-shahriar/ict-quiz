const PREFIX = 'ICT'

// Per-topic entry header byte:
//   bit 7 = 0 → index-list mode,  bits 0-6 = numMarks  (max 127 marks)
//   bit 7 = 1 → bitmask mode,     bits 0-6 = byteLen   (max 127 bytes = 1016 questions)
// Always picks whichever representation is smaller for each topic.

function buildTopicList(topics) {
  return topics.map(t => ({ id: t.id, len: t.questions.length }))
}

function encodeSet(set, tList) {
  const entries = []
  tList.forEach((t, tIdx) => {
    const marks = []
    for (let i = 0; i < t.len; i++) {
      if (set.has(`${t.id}__${i}`)) marks.push(i)
    }
    if (!marks.length) return
    const bitmaskLen = Math.ceil(t.len / 8)
    if (marks.length < bitmaskLen && marks.length < 128) {
      entries.push({ type: 'idx', tIdx, marks })
    } else {
      const bytes = new Uint8Array(bitmaskLen)
      marks.forEach(i => { bytes[i >> 3] |= 1 << (i & 7) })
      entries.push({ type: 'bm', tIdx, bytes })
    }
  })

  const size = 1 + entries.reduce((s, e) =>
    s + 2 + (e.type === 'idx' ? e.marks.length : e.bytes.length), 0)
  const buf = new Uint8Array(size)
  buf[0] = entries.length
  let pos = 1
  for (const e of entries) {
    buf[pos++] = e.tIdx
    if (e.type === 'idx') {
      buf[pos++] = e.marks.length
      for (const m of e.marks) buf[pos++] = m
    } else {
      buf[pos++] = 0x80 | e.bytes.length
      buf.set(e.bytes, pos); pos += e.bytes.length
    }
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
    const header = buf[pos++]
    const topic = tList[tIdx]
    if (header & 0x80) {
      const byteLen = header & 0x7f
      const bytes = buf.slice(pos, pos + byteLen); pos += byteLen
      if (!topic) continue
      for (let i = 0; i < topic.len; i++)
        if (bytes[i >> 3] & (1 << (i & 7))) result.push(`${topic.id}__${i}`)
    } else {
      const numMarks = header
      if (!topic) { pos += numMarks; continue }
      for (let m = 0; m < numMarks; m++) result.push(`${topic.id}__${buf[pos++]}`)
    }
  }
  return result
}

export function generateCypher(mastered, important, topics) {
  const tList = buildTopicList(topics)
  const nBuf = encodeSet(mastered, tList)
  const iBuf = encodeSet(important, tList)
  const combined = new Uint8Array(1 + nBuf.length + iBuf.length)
  combined[0] = nBuf.length
  combined.set(nBuf, 1); combined.set(iBuf, 1 + nBuf.length)
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
    const nLen = combined[0]
    const tList = buildTopicList(topics)
    return {
      nailed:    decodeSet(combined.slice(1, 1 + nLen), tList),
      important: decodeSet(combined.slice(1 + nLen), tList),
    }
  } catch (e) {
    if (e.message.includes('not for')) throw e
    throw new Error('Invalid or corrupted backup code')
  }
}
