import { useState, useEffect } from 'react'

const STORAGE_KEY = 'ict-hand'

export default function useHand() {
  const [hand, setHand] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || 'right'
    document.documentElement.dataset.hand = saved
    return saved
  })

  useEffect(() => {
    document.documentElement.dataset.hand = hand
    localStorage.setItem(STORAGE_KEY, hand)
  }, [hand])

  const toggleHand = () => setHand(h => h === 'right' ? 'left' : 'right')

  return { hand, toggleHand }
}
