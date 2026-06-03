import { createContext, useContext } from 'react'
import useMastered from '../hooks/useMastered.js'

const MasteredContext = createContext(null)

export function MasteredProvider({ children }) {
  const mastered = useMastered()
  return <MasteredContext.Provider value={mastered}>{children}</MasteredContext.Provider>
}

export function useMasteredContext() {
  const ctx = useContext(MasteredContext)
  if (!ctx) throw new Error('useMasteredContext must be used within MasteredProvider')
  return ctx
}
