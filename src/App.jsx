import { Moon, Sun } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BackupModal from './components/BackupModal.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import { ImportantProvider } from './contexts/ImportantContext.jsx'
import { MasteredProvider } from './contexts/MasteredContext.jsx'
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext.jsx'
import { WrittenMasteredProvider } from './contexts/WrittenMasteredContext.jsx'
import { ExtraMasteredProvider } from './contexts/ExtraMasteredContext.jsx'
import { VivaMasteredProvider } from './contexts/VivaMasteredContext.jsx'

const ExamConfig = lazy(() => import('./components/ExamConfig.jsx'))
const ExamMode = lazy(() => import('./components/ExamMode.jsx'))
const ImportantScreen = lazy(() => import('./components/ImportantScreen.jsx'))
const ModeSelect = lazy(() => import('./components/ModeSelect.jsx'))
const NailedScreen = lazy(() => import('./components/NailedScreen.jsx'))
const PracticeMode = lazy(() => import('./components/PracticeMode.jsx'))
const PracticeImportantScreen = lazy(() => import('./components/PracticeImportantScreen.jsx'))
const PracticeImportantRun = lazy(() => import('./components/PracticeImportantRun.jsx'))
const QuizMode = lazy(() => import('./components/QuizMode.jsx'))
const StudyMode = lazy(() => import('./components/StudyMode.jsx'))
const WrittenImportantScreen = lazy(() => import('./components/WrittenImportantScreen.jsx'))
const WrittenMode = lazy(() => import('./components/WrittenMode.jsx'))
const WrittenNailedScreen = lazy(() => import('./components/WrittenNailedScreen.jsx'))
const ExtraImportantScreen = lazy(() => import('./components/ExtraImportantScreen.jsx'))
const ExtraMode = lazy(() => import('./components/ExtraMode.jsx'))
const ExtraNailedScreen = lazy(() => import('./components/ExtraNailedScreen.jsx'))
const VivaImportantScreen = lazy(() => import('./components/VivaImportantScreen.jsx'))
const VivaMode = lazy(() => import('./components/VivaMode.jsx'))
const VivaNailedScreen = lazy(() => import('./components/VivaNailedScreen.jsx'))

export default function App() {
  return (
    <ThemeProvider>
      <MasteredProvider>
        <ImportantProvider>
          <WrittenMasteredProvider>
            <ExtraMasteredProvider>
              <VivaMasteredProvider>
                <AppRoutes />
              </VivaMasteredProvider>
            </ExtraMasteredProvider>
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

      <Suspense fallback={null}>
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
          <Route path="/practice/important" element={<PracticeImportantScreen />} />
          <Route path="/practice/important/run" element={<PracticeImportantRun />} />
          <Route path="/written" element={<WrittenMode />} />
          <Route path="/written/nailed" element={<WrittenNailedScreen />} />
          <Route path="/written/important" element={<WrittenImportantScreen />} />
          <Route path="/extra" element={<ExtraMode />} />
          <Route path="/extra/nailed" element={<ExtraNailedScreen />} />
          <Route path="/extra/important" element={<ExtraImportantScreen />} />
          <Route path="/viva" element={<VivaMode />} />
          <Route path="/viva/nailed" element={<VivaNailedScreen />} />
          <Route path="/viva/important" element={<VivaImportantScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
    </div>
  )
}
