import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BackupModal from './components/BackupModal.jsx'
import ExamConfig from './components/ExamConfig.jsx'
import ExamMode from './components/ExamMode.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import ImportantScreen from './components/ImportantScreen.jsx'
import ModeSelect from './components/ModeSelect.jsx'
import NailedScreen from './components/NailedScreen.jsx'
import PracticeMode from './components/PracticeMode.jsx'
import QuizMode from './components/QuizMode.jsx'
import StudyMode from './components/StudyMode.jsx'
import WrittenImportantScreen from './components/WrittenImportantScreen.jsx'
import WrittenMode from './components/WrittenMode.jsx'
import WrittenNailedScreen from './components/WrittenNailedScreen.jsx'
import { ImportantProvider } from './contexts/ImportantContext.jsx'
import { MasteredProvider } from './contexts/MasteredContext.jsx'
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext.jsx'
import { WrittenMasteredProvider } from './contexts/WrittenMasteredContext.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <MasteredProvider>
        <ImportantProvider>
          <WrittenMasteredProvider>
            <AppRoutes />
          </WrittenMasteredProvider>
        </ImportantProvider>
      </MasteredProvider>
    </ThemeProvider>
  )
}

function AppRoutes() {
  const { theme, toggleTheme } = useThemeContext()
  const location = useLocation()
  const [showBackup, setShowBackup] = useState(false)

  const isHome = location.pathname === '/'

  return (
    <div className="app-root">
      <div className="bg-canvas" aria-hidden="true">
        {isHome && <div className="bg-aurora" />}
        <div className="bg-grid" />
      </div>

      {isHome && (
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      )}

      <Routes>
        <Route path="/" element={<HomeScreen onBackup={() => setShowBackup(true)} />} />
        <Route path="/mcq/:topicId" element={<ModeSelect />} />
        <Route path="/mcq/:topicId/quiz" element={<QuizMode />} />
        <Route path="/mcq/:topicId/study" element={<StudyMode />} />
        <Route path="/exam" element={<ExamConfig />} />
        <Route path="/exam/run" element={<ExamMode />} />
        <Route path="/nailed" element={<NailedScreen />} />
        <Route path="/important" element={<ImportantScreen />} />
        <Route path="/practice" element={<PracticeMode />} />
        <Route path="/written" element={<WrittenMode />} />
        <Route path="/written/nailed" element={<WrittenNailedScreen />} />
        <Route path="/written/important" element={<WrittenImportantScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
    </div>
  )
}
