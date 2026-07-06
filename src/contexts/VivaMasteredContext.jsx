import { createContext, useContext } from 'react'
import useVivaMastered from '../hooks/useVivaMastered.js'

const VivaMasteredContext = createContext(null)

export function VivaMasteredProvider({ children }) {
  const vivaMastered = useVivaMastered()
  return <VivaMasteredContext.Provider value={vivaMastered}>{children}</VivaMasteredContext.Provider>
}

export function useVivaMasteredContext() {
  const ctx = useContext(VivaMasteredContext)
  if (!ctx) throw new Error('useVivaMasteredContext must be used within VivaMasteredProvider')
  return ctx
}
