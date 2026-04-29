import { useState } from 'react'
import { TOPICS } from './data/index.js'
import HomeScreen from './components/HomeScreen.jsx'
import ModeSelect from './components/ModeSelect.jsx'
import QuizMode from './components/QuizMode.jsx'
import StudyMode from './components/StudyMode.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [selectedTopic, setSelectedTopic] = useState(null)

  const goHome = () => { setScreen('home'); setSelectedTopic(null) }

  return (
    <div className="app-root">
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
