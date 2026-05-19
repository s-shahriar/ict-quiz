const PREFIX = 'ICT'

// ── MCQ helpers ──────────────────────────────────────────────────────────────
// Per-topic entry header byte:
//   bit 7 = 0 → index-list mode,  bits 0-6 = numMarks  (max 127 marks)
//   bit 7 = 1 → bitmask mode,     bits 0-6 = byteLen   (max 127 bytes = 1016 questions)

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

// ── Written helpers ───────────────────────────────────────────────────────────
// writtenTList = [{ id, questions: [{ id: 'cf_001', ... }] }]
// qid format: `written__${topicId}__${questionId}`

function encodeWrittenSet(set, writtenTList) {
  const entries = []
  writtenTList.forEach((t, tIdx) => {
    const marks = []
    t.questions.forEach((q, i) => {
      if (set.has(`written__${t.id}__${q.id}`)) marks.push(i)
    })
    if (!marks.length) return
    const bitmaskLen = Math.ceil(t.questions.length / 8) || 1
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

function decodeWrittenSet(buf, writtenTList) {
  const result = []
  if (!buf || buf.length < 1) return result
  const numEntries = buf[0]
  let pos = 1
  for (let e = 0; e < numEntries; e++) {
    if (pos + 1 >= buf.length) break
    const tIdx = buf[pos++]
    const header = buf[pos++]
    const topic = writtenTList[tIdx]
    if (header & 0x80) {
      const byteLen = header & 0x7f
      const bytes = buf.slice(pos, pos + byteLen); pos += byteLen
      if (!topic) continue
      for (let i = 0; i < topic.questions.length; i++)
        if (bytes[i >> 3] & (1 << (i & 7)))
          result.push(`written__${topic.id}__${topic.questions[i].id}`)
    } else {
      const numMarks = header
      if (!topic) { pos += numMarks; continue }
      for (let m = 0; m < numMarks; m++) {
        const qi = buf[pos++]
        if (topic.questions[qi]) result.push(`written__${topic.id}__${topic.questions[qi].id}`)
      }
    }
  }
  return result
}

// ── v2 format ─────────────────────────────────────────────────────────────────
// [0xFF][nLen_lo][nLen_hi][nBuf][iLen_lo][iLen_hi][iBuf][wNLen_lo][wNLen_hi][wNBuf][wIBuf]
// v1 format (legacy): [nLen_byte][nBuf][iBuf]

export function generateCypher(mastered, important, writtenMastered, topics, writtenTList) {
  const tList = buildTopicList(topics)
  const nBuf  = encodeSet(mastered, tList)

  const mcqImportant = new Set([...important].filter(id => !id.startsWith('written__')))
  const iBuf  = encodeSet(mcqImportant, tList)

  const wNBuf = encodeWrittenSet(writtenMastered, writtenTList)

  const writtenImportant = new Set([...important].filter(id => id.startsWith('written__')))
  const wIBuf = encodeWrittenSet(writtenImportant, writtenTList)

  const totalSize = 1 + 2 + nBuf.length + 2 + iBuf.length + 2 + wNBuf.length + wIBuf.length
  const combined  = new Uint8Array(totalSize)
  let pos = 0
  combined[pos++] = 0xFF
  combined[pos++] = nBuf.length  & 0xFF; combined[pos++] = (nBuf.length  >> 8) & 0xFF
  combined.set(nBuf,  pos); pos += nBuf.length
  combined[pos++] = iBuf.length  & 0xFF; combined[pos++] = (iBuf.length  >> 8) & 0xFF
  combined.set(iBuf,  pos); pos += iBuf.length
  combined[pos++] = wNBuf.length & 0xFF; combined[pos++] = (wNBuf.length >> 8) & 0xFF
  combined.set(wNBuf, pos); pos += wNBuf.length
  combined.set(wIBuf, pos)

  const b64 = btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${PREFIX}:${b64}`
}

export function parseCypher(cypher, topics, writtenTList) {
  const text = cypher.trim()
  if (!text.startsWith(`${PREFIX}:`)) throw new Error('This backup code is not for ICT Quiz')
  try {
    const raw = text.slice(PREFIX.length + 1)
    // Backward-compat: old JSON format
    try {
      const json = JSON.parse(atob(raw))
      if (Array.isArray(json.n) && Array.isArray(json.i))
        return { nailed: json.n, important: json.i, writtenNailed: [], writtenImportant: [] }
    } catch {}

    const binary   = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
    const combined = Uint8Array.from(binary, c => c.charCodeAt(0))
    const tList    = buildTopicList(topics)

    if (combined[0] === 0xFF) {
      // v2
      let pos = 1
      const nLen  = combined[pos] | (combined[pos + 1] << 8); pos += 2
      const nBuf  = combined.slice(pos, pos + nLen);           pos += nLen
      const iLen  = combined[pos] | (combined[pos + 1] << 8); pos += 2
      const iBuf  = combined.slice(pos, pos + iLen);           pos += iLen
      const wNLen = combined[pos] | (combined[pos + 1] << 8); pos += 2
      const wNBuf = combined.slice(pos, pos + wNLen);          pos += wNLen
      const wIBuf = combined.slice(pos)
      return {
        nailed:          decodeSet(nBuf, tList),
        important:       decodeSet(iBuf, tList),
        writtenNailed:   decodeWrittenSet(wNBuf, writtenTList || []),
        writtenImportant: decodeWrittenSet(wIBuf, writtenTList || []),
      }
    } else {
      // v1 legacy
      const nLen = combined[0]
      return {
        nailed:          decodeSet(combined.slice(1, 1 + nLen), tList),
        important:       decodeSet(combined.slice(1 + nLen), tList),
        writtenNailed:   [],
        writtenImportant: [],
      }
    }
  } catch (e) {
    if (e.message.includes('not for')) throw e
    throw new Error('Invalid or corrupted backup code')
  }
}
