import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { TOPICS } from './data/index.js'
import { getWrittenData, getWrittenCount } from './data/written/index.js'
import HomeScreen   from './components/HomeScreen.jsx'
import ModeSelect   from './components/ModeSelect.jsx'
import QuizMode     from './components/QuizMode.jsx'
import StudyMode    from './components/StudyMode.jsx'
import WrittenMode  from './components/WrittenMode.jsx'
import ExamConfig   from './components/ExamConfig.jsx'
import ExamMode     from './components/ExamMode.jsx'

const WRITTEN_TOPICS = TOPICS
  .map(t => ({ ...t, writtenCount: getWrittenCount(t.id) }))
  .filter(t => t.writtenCount > 0)

function loadMastered() {
  try { return new Set(JSON.parse(localStorage.getItem('ict-nailed') ?? '[]')) }
  catch { return new Set() }
}

function saveMastered(set) {
  localStorage.setItem('ict-nailed', JSON.stringify([...set]))
}

export default function App() {
  const [screen, setScreen]         = useState('home')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [examData, setExamData]     = useState(null)   // { questions, label }
  const [theme, setTheme]           = useState(() => localStorage.getItem('ict-theme') || 'light')
  const [mastered, setMastered]     = useState(loadMastered)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ict-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  const goHome      = () => { setScreen('home'); setSelectedTopic(null); setExamData(null) }

  const nail = (qid) => setMastered(prev => {
    const next = new Set(prev); next.add(qid); saveMastered(next); return next
  })

  const unnail = (qid) => setMastered(prev => {
    const next = new Set(prev); next.delete(qid); saveMastered(next); return next
  })

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
          mastered={mastered}
          onSelectMCQ={(t) => { setSelectedTopic(t); setScreen('mode') }}
          onSelectWritten={(t) => { setSelectedTopic(t); setScreen('written') }}
          onExam={() => setScreen('exam_config')}
          onUnnail={unnail}
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
          key={selectedTopic.id + '-study'}
          topic={selectedTopic}
          mastered={mastered}
          onNail={nail}
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
      {screen === 'exam_config' && (
        <ExamConfig
          topics={TOPICS}
          onStart={(data) => { setExamData(data); setScreen('exam') }}
          onBack={goHome}
        />
      )}
      {screen === 'exam' && examData && (
        <ExamMode
          key={examData.label + examData.questions.length}
          questions={examData.questions}
          label={examData.label}
          onHome={goHome}
        />
      )}
    </div>
  )
}
