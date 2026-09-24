import { useState, useEffect } from 'react'

const STORAGE_KEY = 'ict-theme'
const THEME_COLOR = { light: '#DCE4EA', dark: '#0A0F13' }
const media = window.matchMedia('(prefers-color-scheme: dark)')
const systemTheme = () => (media.matches ? 'dark' : 'light')

// No stored choice = follow the device. Toggling stores an explicit choice.
export default function useTheme() {
  const [saved, setSaved] = useState(() => localStorage.getItem(STORAGE_KEY))
  const [system, setSystem] = useState(systemTheme)
  const theme = saved || system

  useEffect(() => {
    const onChange = () => setSystem(systemTheme())
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', THEME_COLOR[theme]))
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, next)
    setSaved(next)
  }

  return { theme, toggleTheme }
}
