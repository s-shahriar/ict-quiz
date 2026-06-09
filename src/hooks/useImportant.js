import { useState } from 'react'

const STORAGE_KEY = 'ict-important'

// Legacy practice ids used a per-tab scheme (…__q__<index> for drills,
// …__c__<cmd> for commands). They're now keyed by command string so the two
// tabs link, which makes the old ids dead — drop them once on load.
const LEGACY_PRACTICE = /^practice__.+__[qc]__/

function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    const cleaned = Array.isArray(arr) ? arr.filter(id => !LEGACY_PRACTICE.test(id)) : []
    if (cleaned.length !== (arr?.length ?? 0)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    }
    return new Set(cleaned)
  } catch { return new Set() }
}

function save(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export default function useImportant() {
  const [value, setValue] = useState(load)

  const add = (id) => setValue(prev => {
    const next = new Set(prev)
    next.add(id)
    save(next)
    return next
  })

  const remove = (id) => setValue(prev => {
    const next = new Set(prev)
    next.delete(id)
    save(next)
    return next
  })

  const toggle = (id) => setValue(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    save(next)
    return next
  })

  const has = (id) => value.has(id)

  return { value, add, remove, toggle, has }
}
