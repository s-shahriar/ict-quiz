import { createContext, useContext } from 'react'
import useWrittenMastered from '../hooks/useWrittenMastered.js'

const WrittenMasteredContext = createContext(null)

export function WrittenMasteredProvider({ children }) {
  const writtenMastered = useWrittenMastered()
  return <WrittenMasteredContext.Provider value={writtenMastered}>{children}</WrittenMasteredContext.Provider>
}

export function useWrittenMasteredContext() {
  const ctx = useContext(WrittenMasteredContext)
  if (!ctx) throw new Error('useWrittenMasteredContext must be used within WrittenMasteredProvider')
  return ctx
}
