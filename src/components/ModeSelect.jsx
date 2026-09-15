import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import TopbarActions from './shared/TopbarActions.jsx'
import { ChevronLeft, Brain, BookOpen, Bookmark, Flame, Star, ListChecks, X } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useWeakContext } from '../contexts/WeakContext.jsx'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'

export default function ModeSelect() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const topic = TOPICS.find(t => t.id === topicId)
  const ready = useModuleReady('mcq')
  const { value: important } = useImportantContext()
  const { value: weak } = useWeakContext()
  const { value: mastered } = useMasteredContext()
  const [chooser, setChooser] = useState(false)

  if (!topic) return <Navigate to="/" replace />

  // Same pool QuizMode draws from, so the counts shown are what you'll get.
  const quizzable = topic.questions.filter(q => q.options && q.correct_answer)
  let importantCt = 0
  let weakCt = 0
  let nailedCt = 0
  for (const q of quizzable) {
    if (important?.has(q._uid)) importantCt++
    if (weak?.has(q._uid)) weakCt++
    if (mastered?.has(q._uid)) nailedCt++
  }

  // Nothing marked in this topic → nothing to choose between; start straight away.
  const startQuiz = () => {
    if (ready && (importantCt || nailedCt)) setChooser(true)
    else navigate('quiz')
  }

  const Icon = topic.icon
  return (
    <div className="mode-page anim-fade">
      <div className="study-topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ChevronLeft size={15} /> All Topics
        </button>
        <TopbarActions />
      </div>

      <div className="mode-topic-hero">
        <div
          className="mode-icon-circle"
          style={{
            background: `${topic.color}1a`,
            color: topic.color,
            boxShadow: `0 8px 40px ${topic.color}30, 0 0 0 1px ${topic.color}20`,
          }}
        >
          <Icon size={38} />
        </div>
        <div className="mode-topic-name" style={{ color: topic.color }}>
          {topic.name}
        </div>
        <div className="mode-topic-meta">{ready ? `${topic.questions.length} questions available` : 'Loading…'}</div>
      </div>

      <div className="mode-cards">
        <button className="mode-card" onClick={startQuiz}>
          <div className="mode-card-icon" style={{ background: `${topic.color}1a`, color: topic.color }}>
            <Brain size={26} />
          </div>
          <h3>Quiz Mode</h3>
          <p>Answer questions one by one. Get instant right/wrong feedback and track your score.</p>
          <span className="mode-card-cta" style={{ color: topic.color }}>Start Quiz →</span>
        </button>

        <button className="mode-card" onClick={() => navigate('study')}>
          <div className="mode-card-icon" style={{ background: `${topic.color}1a`, color: topic.color }}>
            <BookOpen size={26} />
          </div>
          <h3>Study Mode</h3>
          <p>Browse all Q&amp;A at your own pace. Reveal answers when ready. Great for revision.</p>
          <span className="mode-card-cta" style={{ color: topic.color }}>Start Reading →</span>
        </button>
      </div>

      {chooser && (
        <QuizPoolChooser
          color={topic.color}
          counts={{ all: quizzable.length, important: importantCt, weak: weakCt, nailed: nailedCt }}
          onClose={() => setChooser(false)}
          onPick={(set) => navigate(set === 'all' ? 'quiz' : `quiz?set=${set}`)}
        />
      )}
    </div>
  )
}

const POOLS = [
  { key: 'all', icon: ListChecks, title: 'সব প্রশ্ন', sub: 'পুরো টপিক থেকে' },
  { key: 'important', icon: Bookmark, title: 'শুধু Important', sub: 'যেগুলো Important করে রেখেছো' },
  { key: 'weak', icon: Flame, title: 'শুধু Weak', sub: 'Important-এর মধ্যে যেগুলো এখনো পারো না' },
  { key: 'nailed', icon: Star, title: 'শুধু Nailed It', sub: 'যেগুলো আয়ত্তে এসেছে — ঝালিয়ে নাও' },
]

// Which questions the quiz draws from. A centred card on desktop, a bottom
// sheet on phones (CSS). Backdrop tap or Esc closes it.
function QuizPoolChooser({ color, counts, onClose, onPick }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="trash-modal-backdrop quiz-pool-backdrop" onClick={onClose}>
      <div
        className="trash-modal quiz-pool-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-pool-title"
        style={{ '--pc': color }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quiz-pool-head">
          <h3 id="quiz-pool-title" className="trash-modal-title">কোন প্রশ্নগুলো থেকে কুইজ দেবে?</h3>
          <button className="cat-sidebar-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="quiz-pool-list">
          {POOLS.map(({ key, icon: PoolIcon, title, sub }) => {
            const n = counts[key]
            return (
              <button key={key} className={`quiz-pool-option pool-${key}`} disabled={!n} onClick={() => onPick(key)}>
                <span className="quiz-pool-icon">
                  <PoolIcon size={17} fill={key === 'all' ? 'none' : 'currentColor'} />
                </span>
                <span className="quiz-pool-text">
                  <span className="quiz-pool-title">{title}</span>
                  <span className="quiz-pool-sub">{n ? sub : 'এখনো কোনো প্রশ্ন নেই'}</span>
                </span>
                <span className="quiz-pool-count">{n}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
