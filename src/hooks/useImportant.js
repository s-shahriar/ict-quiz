import { useState } from 'react'

const STORAGE_KEY = 'ict-important'

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')) }
  catch { return new Set() }
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
