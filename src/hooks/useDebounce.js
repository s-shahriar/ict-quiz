import { useEffect, useState } from 'react'

// Returns a debounced copy of `value` that only updates after `delay` ms of
// no changes. Used to avoid recomputing search results on every keystroke.
export default function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
