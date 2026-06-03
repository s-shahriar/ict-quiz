import { createContext, useContext } from 'react'
import useImportant from '../hooks/useImportant.js'

const ImportantContext = createContext(null)

export function ImportantProvider({ children }) {
  const important = useImportant()
  return <ImportantContext.Provider value={important}>{children}</ImportantContext.Provider>
}

export function useImportantContext() {
  const ctx = useContext(ImportantContext)
  if (!ctx) throw new Error('useImportantContext must be used within ImportantProvider')
  return ctx
}
