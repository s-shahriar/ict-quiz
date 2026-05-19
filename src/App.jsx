import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { TOPICS } from './data/index.js'
import { getWrittenData, getWrittenCount } from './data/written/index.js'
import HomeScreen       from './components/HomeScreen.jsx'
import ModeSelect       from './components/ModeSelect.jsx'
import QuizMode         from './components/QuizMode.jsx'
import StudyMode        from './components/StudyMode.jsx'
import WrittenMode      from './components/WrittenMode.jsx'
import ExamConfig       from './components/ExamConfig.jsx'
import ExamMode         from './components/ExamMode.jsx'
import NailedScreen            from './components/NailedScreen.jsx'
import ImportantScreen         from './components/ImportantScreen.jsx'
import WrittenImportantScreen  from './components/WrittenImportantScreen.jsx'
import WrittenNailedScreen     from './components/WrittenNailedScreen.jsx'
import BackupModal             from './components/BackupModal.jsx'

const WRITTEN_TOPICS = TOPICS
  .map(t => ({ ...t, writtenCount: getWrittenCount(t.id) }))
  .filter(t => t.writtenCount > 0)

const WRITTEN_TLIST = WRITTEN_TOPICS.map(t => {
  const data = getWrittenData(t.id)
  return { id: t.id, questions: data.questions || [] }
})

function loadMastered() {
  try { return new Set(JSON.parse(localStorage.getItem('ict-nailed') ?? '[]')) }
  catch { return new Set() }
}
function saveMastered(set) {
  localStorage.setItem('ict-nailed', JSON.stringify([...set]))
}

function loadImportant() {
  try { return new Set(JSON.parse(localStorage.getItem('ict-important') ?? '[]')) }
  catch { return new Set() }
}
function saveImportant(set) {
  localStorage.setItem('ict-important', JSON.stringify([...set]))
}

function loadWrittenMastered() {
  try { return new Set(JSON.parse(localStorage.getItem('ict-written-nailed') ?? '[]')) }
  catch { return new Set() }
}
function saveWrittenMastered(set) {
  localStorage.setItem('ict-written-nailed', JSON.stringify([...set]))
}

export default function App() {
  const [screen, setScreen]               = useState('home')
  const [activeModule, setActiveModule]   = useState('mcq')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [examData, setExamData]           = useState(null)
  const [theme, setTheme]                 = useState(() => localStorage.getItem('ict-theme') || 'light')
  const [mastered, setMastered]               = useState(loadMastered)
  const [important, setImportant]             = useState(loadImportant)
  const [writtenMastered, setWrittenMastered] = useState(loadWrittenMastered)
  const [showBackup, setShowBackup]           = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('ict-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const goHome              = () => { setScreen('home'); setSelectedTopic(null); setExamData(null) }
  const goWrittenHome       = () => { setScreen('home'); setSelectedTopic(null); setActiveModule('written') }
  const goWrittenImportant  = () => setScreen('written_important')
  const goWrittenNailed     = () => setScreen('written_nailed')

  const nail = (qid) => setMastered(prev => {
    const next = new Set(prev); next.add(qid); saveMastered(next); return next
  })
  const unnail = (qid) => setMastered(prev => {
    const next = new Set(prev); next.delete(qid); saveMastered(next); return next
  })

  const markImportant = (qid) => setImportant(prev => {
    const next = new Set(prev); next.add(qid); saveImportant(next); return next
  })
  const unmarkImportant = (qid) => setImportant(prev => {
    const next = new Set(prev); next.delete(qid); saveImportant(next); return next
  })

  const nailWritten = (qid) => setWrittenMastered(prev => {
    const next = new Set(prev); next.add(qid); saveWrittenMastered(next); return next
  })
  const unnailWritten = (qid) => setWrittenMastered(prev => {
    const next = new Set(prev); next.delete(qid); saveWrittenMastered(next); return next
  })

  const handleRestore = (nailedArr, importantArr, writtenNailedArr, writtenImportantArr) => {
    setMastered(prev => {
      const next = new Set([...prev, ...nailedArr]); saveMastered(next); return next
    })
    setImportant(prev => {
      const next = new Set([...prev, ...importantArr, ...writtenImportantArr]); saveImportant(next); return next
    })
    setWrittenMastered(prev => {
      const next = new Set([...prev, ...writtenNailedArr]); saveWrittenMastered(next); return next
    })
  }

  return (
    <div className="app-root">
      <div className="bg-canvas" aria-hidden="true">
        <div className="bg-aurora" />
        <div className="bg-grid" />
      </div>

      {/* Theme toggle only on home screen */}
      {screen === 'home' && (
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      )}

      {screen === 'home' && (
        <HomeScreen
          topics={TOPICS}
          writtenTopics={WRITTEN_TOPICS}
          mastered={mastered}
          important={important}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          onSelectMCQ={(t) => { setSelectedTopic(t); setScreen('mode') }}
          onSelectWritten={(t) => { setSelectedTopic(t); setScreen('written') }}
          onExam={() => setScreen('exam_config')}
          onNailed={() => setScreen('nailed')}
          onImportant={() => setScreen('important')}
          onWrittenImportant={goWrittenImportant}
          onWrittenNailed={goWrittenNailed}
          writtenMastered={writtenMastered}
          onBackup={() => setShowBackup(true)}
          onUnnail={unnail}
        />
      )}
      {screen === 'nailed' && (
        <NailedScreen
          topics={TOPICS}
          mastered={mastered}
          onUnnail={unnail}
          onHome={goHome}
        />
      )}
      {screen === 'important' && (
        <ImportantScreen
          topics={TOPICS}
          important={important}
          onUnmark={unmarkImportant}
          onHome={goHome}
        />
      )}
      {screen === 'written_important' && (
        <WrittenImportantScreen
          writtenTopics={WRITTEN_TOPICS}
          important={important}
          onUnmark={unmarkImportant}
          onHome={goWrittenHome}
        />
      )}
      {screen === 'written_nailed' && (
        <WrittenNailedScreen
          writtenTopics={WRITTEN_TOPICS}
          writtenMastered={writtenMastered}
          onUnnail={unnailWritten}
          onHome={goWrittenHome}
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
          mastered={mastered}
          important={important}
          onNail={nail}
          onUnnail={unnail}
          onMarkImportant={markImportant}
          onUnmarkImportant={unmarkImportant}
          onBack={() => setScreen('mode')}
          onHome={goHome}
        />
      )}
      {screen === 'study' && (
        <StudyMode
          key={selectedTopic.id + '-study'}
          topic={selectedTopic}
          mastered={mastered}
          important={important}
          onNail={nail}
          onMarkImportant={markImportant}
          onUnmarkImportant={unmarkImportant}
          onBack={() => setScreen('mode')}
          onHome={goHome}
        />
      )}
      {screen === 'written' && (
        <WrittenMode
          key={selectedTopic.id + '-written'}
          topic={selectedTopic}
          writtenData={getWrittenData(selectedTopic.id)}
          important={important}
          writtenMastered={writtenMastered}
          onMarkImportant={markImportant}
          onUnmarkImportant={unmarkImportant}
          onNailWritten={nailWritten}
          onUnnailWritten={unnailWritten}
          onBack={goWrittenHome}
          onHome={goHome}
        />
      )}
      {screen === 'exam_config' && (
        <ExamConfig
          topics={TOPICS}
          important={important}
          onStart={(data) => { setExamData(data); setScreen('exam') }}
          onBack={goHome}
        />
      )}
      {screen === 'exam' && examData && (
        <ExamMode
          key={examData.label + examData.questions.length}
          questions={examData.questions}
          label={examData.label}
          mastered={mastered}
          important={important}
          onNail={nail}
          onUnnail={unnail}
          onMarkImportant={markImportant}
          onUnmarkImportant={unmarkImportant}
          onHome={goHome}
        />
      )}
      {showBackup && (
        <BackupModal
          mastered={mastered}
          important={important}
          writtenMastered={writtenMastered}
          topics={TOPICS}
          writtenTList={WRITTEN_TLIST}
          onRestore={handleRestore}
          onClose={() => setShowBackup(false)}
        />
      )}
    </div>
  )
}
