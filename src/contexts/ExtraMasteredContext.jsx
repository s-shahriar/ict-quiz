import { createContext, useContext } from 'react'
import useExtraMastered from '../hooks/useExtraMastered.js'

const ExtraMasteredContext = createContext(null)

export function ExtraMasteredProvider({ children }) {
  const extraMastered = useExtraMastered()
  return <ExtraMasteredContext.Provider value={extraMastered}>{children}</ExtraMasteredContext.Provider>
}

export function useExtraMasteredContext() {
  const ctx = useContext(ExtraMasteredContext)
  if (!ctx) throw new Error('useExtraMasteredContext must be used within ExtraMasteredProvider')
  return ctx
}
