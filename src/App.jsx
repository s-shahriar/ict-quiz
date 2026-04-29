import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { TOPICS } from './data/index.js'
import HomeScreen from './components/HomeScreen.jsx'
import ModeSelect from './components/ModeSelect.jsx'
import QuizMode from './components/QuizMode.jsx'
import StudyMode from './components/StudyMode.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('ict-theme') || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ict-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  const goHome = () => { setScreen('home'); setSelectedTopic(null) }

  return (
    <div className="app-root">
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {screen === 'home' && (
        <HomeScreen
          topics={TOPICS}
          onSelect={(t) => { setSelectedTopic(t); setScreen('mode') }}
        />
      )}
      {screen === 'mode' && (
        <ModeSelect
          topic={selectedTopic}
          onQuiz={() => setScreen('quiz')}
          onStudy={() => setScreen('study')}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'quiz' && (
        <QuizMode
          key={selectedTopic.id + '-quiz'}
          topic={selectedTopic}
          onBack={() => setScreen('mode')}
          onHome={goHome}
        />
      )}
      {screen === 'study' && (
        <StudyMode
          topic={selectedTopic}
          onBack={() => setScreen('mode')}
          onHome={goHome}
        />
      )}
    </div>
  )
}
