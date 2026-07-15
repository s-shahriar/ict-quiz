import { createContext, useContext } from 'react'
import useHand from '../hooks/useHand.js'

const HandContext = createContext(null)

export function HandProvider({ children }) {
  const hand = useHand()
  return <HandContext.Provider value={hand}>{children}</HandContext.Provider>
}

export function useHandContext() {
  const ctx = useContext(HandContext)
  if (!ctx) throw new Error('useHandContext must be used within HandProvider')
  return ctx
}
