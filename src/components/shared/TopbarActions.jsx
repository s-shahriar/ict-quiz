import { Moon, Sun } from 'lucide-react'
import HandToggle from './HandToggle.jsx'
import { SyncButton } from '../SyncStatus.jsx'
import { useThemeContext } from '../../contexts/ThemeContext.jsx'

// The standard top-bar control cluster, identical on every screen: hand
// (left/right layout) + theme toggle + the sync queue. The sync button belongs
// here rather than in the app shell because the shell's own chrome is hidden on
// quiz / study / written, which is exactly where changes get queued.
//
// Screens with their own extras — a category browser, a score pill, a stop
// button — pass them as children and they render after the standard trio, so
// the constants always sit in the same place.
export default function TopbarActions({ children, style, className }) {
  const { theme, toggleTheme } = useThemeContext()
  return (
    <div className={`topbar-right-actions${className ? ' ' + className : ''}`} style={style}>
      <HandToggle />
      <button className="study-home-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <SyncButton className="study-home-btn" size={16} />
      {children}
    </div>
  )
}
