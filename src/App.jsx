import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { TOPICS } from './data/index.js'
import { getWrittenData, getWrittenCount } from './data/written/index.js'
import HomeScreen from './components/HomeScreen.jsx'
import ModeSelect from './components/ModeSelect.jsx'
import QuizMode from './components/QuizMode.jsx'
import StudyMode from './components/StudyMode.jsx'
import WrittenMode from './components/WrittenMode.jsx'

// Topics that have written questions, enriched with writtenCount
const WRITTEN_TOPICS = TOPICS
  .map(t => ({ ...t, writtenCount: getWrittenCount(t.id) }))
  .filter(t => t.writtenCount > 0)

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
      <div className="bg-canvas" aria-hidden="true">
        <div className="bg-aurora" />
        <div className="bg-grid" />
      </div>

      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {screen === 'home' && (
        <HomeScreen
          topics={TOPICS}
          writtenTopics={WRITTEN_TOPICS}
          onSelectMCQ={(t) => { setSelectedTopic(t); setScreen('mode') }}
          onSelectWritten={(t) => { setSelectedTopic(t); setScreen('written') }}
        />
      )}
      {screen === 'mode' && (
        <ModeSelect
          topic={selectedTopic}
          onQuiz={() => setScreen('quiz')}
          onStudy={() => setScreen('study')}
          onBack={goHome}
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
      {screen === 'written' && (
        <WrittenMode
          key={selectedTopic.id + '-written'}
          topic={selectedTopic}
          writtenData={getWrittenData(selectedTopic.id)}
          onBack={goHome}
          onHome={goHome}
        />
      )}
    </div>
  )
}
