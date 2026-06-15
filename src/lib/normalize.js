// Normalize text for flexible, order- and punctuation-insensitive search.
//  - NFC so differently-encoded but identical text matches (esp. Bangla),
//  - drop zero-width joiners/non-joiners (common in Bangla conjuncts),
//  - strip punctuation (incl. Bangla dari/quotes), collapse whitespace.
const ZERO_WIDTH = /[​-‍﻿]/g
const PUNCT = /[?।!,.;:'"’‘“”()[\]{}<>—–\-_/\\|*•]+/g

export function normalize(s) {
  return (s ?? '').toString().normalize('NFC').replace(ZERO_WIDTH, '').toLowerCase()
    .replace(PUNCT, ' ').replace(/\s+/g, ' ').trim()
}

// Tokenize a query into words; a haystack matches if it contains EVERY token.
export function tokenize(query) {
  const t = normalize(query)
  return t ? t.split(' ') : []
}

export function matchesAll(haystack, tokens) {
  return tokens.every(tok => haystack.includes(tok))
}
