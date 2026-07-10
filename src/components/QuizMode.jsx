import { useState, useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, XCircle, ArrowRight, Home, Trophy, Lightbulb, Star, Bookmark } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useModuleReady } from '../data/contentLoader.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizMode() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const topic = TOPICS.find(t => t.id === topicId)
  const ready = useModuleReady('mcq')
  const { value: mastered, add: nail, remove: unnail } = useMasteredContext()
  const { value: important, add: markImportant, remove: unmarkImportant } = useImportantContext()

  const questions = useMemo(
    () => topic
      ? shuffle(topic.questions.filter(q => q.options && q.correct_answer))
      : [],
    [topic, ready] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (!topic) return <Navigate to="/" replace />
  if (!ready) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-3)', fontSize: '0.85rem' }}>Loading…</div>

  const q = questions[idx]
  const opts = q ? ['a','b','c','d'].filter(k => q.options?.[k]) : []
  const qid = q ? q._uid : null
  const isNailed = qid ? mastered?.has(qid) : false
  const isImportant = qid ? important?.has(qid) : false

  const pick = (key) => {
    if (revealed) return
    setSelected(key)
    setRevealed(true)
    if (key === q.correct_answer) setScore(s => s + 1)
  }

  const next = () => {
    if (idx + 1 >= questions.length) { setDone(true); return }
    setIdx(i => i + 1)
    setSelected(null)
    setRevealed(false)
  }

  const retry = () => {
    setIdx(0); setSelected(null); setRevealed(false)
    setScore(0); setDone(false)
  }

  if (!q || done) {
    return <ScoreScreen score={score} total={questions.length} topic={topic} onRetry={retry} onHome={() => navigate('/')} />
  }

  const progress = ((idx + (revealed ? 1 : 0)) / questions.length) * 100
  const isCorrect = selected === q.correct_answer

  return (
    <div className="quiz-page anim-fade">
      <div className="quiz-topbar">
        <button className="back-btn" onClick={() => navigate('/mcq/' + topic.id)}>
          <ChevronLeft size={15} /> Back
        </button>
        <span className="quiz-topic-pill" style={{ color: topic.color }}>{topic.shortName}</span>
        <span className="quiz-score-pill">{score} pts</span>
      </div>

      <div className="quiz-progress-wrap">
        <div className="quiz-progress-header">
          <span className="quiz-qnum">Question {idx + 1} of {questions.length}</span>
          <span className="quiz-pct">{Math.round(progress)}%</span>
        </div>
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{ '--progress': progress / 100, background: topic.color }} />
        </div>
      </div>

      <div className="quiz-card anim-slide">
        <p className="quiz-question">{q.question}</p>

        <div className="quiz-options">
          {opts.map(key => {
            let cls = 'opt-btn'
            if (revealed) {
              if (key === q.correct_answer) cls += ' correct revealed'
              else if (key === selected) cls += ' wrong revealed'
              else cls += ' dim revealed'
            }
            return (
              <button
                key={key}
                className={cls}
                style={{ '--c': topic.color }}
                onClick={() => pick(key)}
              >
                <span className="opt-key">{key.toUpperCase()}</span>
                <span className="opt-text">{q.options[key]}</span>
                {revealed && key === q.correct_answer && (
                  <CheckCircle size={15} className="opt-icon" style={{ color: '#10b981' }} />
                )}
                {revealed && key === selected && key !== q.correct_answer && (
                  <XCircle size={15} className="opt-icon" style={{ color: '#ef4444' }} />
                )}
              </button>
            )
          })}
        </div>

        {revealed && q.explanation && (
          <div className="explanation-box anim-slide" style={{ '--c': topic.color }}>
            <div className="explanation-header">
              <Lightbulb size={14} style={{ color: topic.color, flexShrink: 0 }} />
              <span className="explanation-label" style={{ color: topic.color }}>ব্যাখ্যা</span>
              <span className={`answer-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                {isCorrect ? '✓ সঠিক' : '✗ ভুল'}
              </span>
            </div>
            <p className="explanation-text">{q.explanation}</p>
          </div>
        )}

        {revealed && (
          <div className="quiz-revealed-actions">
            <div className="quiz-mark-btns">
              <button
                className={`quiz-nail-btn${isNailed ? ' nailed' : ''}`}
                onClick={() => isNailed ? unnail(qid) : nail(qid)}
                title={isNailed ? 'Nailed — click to un-nail' : 'Mark as Nailed It'}
              >
                <Star size={16} fill={isNailed ? 'currentColor' : 'none'} strokeWidth={1.8} />
                {isNailed ? 'Nailed!' : 'Nail It'}
              </button>
              <button
                className={`quiz-important-btn${isImportant ? ' marked' : ''}`}
                onClick={() => isImportant ? unmarkImportant(qid) : markImportant(qid)}
                title={isImportant ? 'Important — click to remove' : 'Mark as Important'}
              >
                <Bookmark size={16} fill={isImportant ? 'currentColor' : 'none'} strokeWidth={1.8} />
                {isImportant ? 'Saved!' : 'Important'}
              </button>
            </div>
            <button className="quiz-next-btn" onClick={next}>
              {idx + 1 >= questions.length ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreScreen({ score, total, topic, onRetry, onHome }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const msg =
    pct >= 80 ? 'অসাধারণ! তুমি দারুণ করেছ!' :
    pct >= 60 ? 'ভালো হয়েছে! আরেকটু চেষ্টা করো।' :
    pct >= 40 ? 'আরো অনুশীলন করো।' :
                'হাল ছেড়ো না, আবার চেষ্টা করো!'

  const r = 54
  const circumference = 2 * Math.PI * r
  const strokeOffset = circumference - (pct / 100) * circumference

  return (
    <div className="score-page anim-fade">
      <div className="score-card">
        <Trophy size={44} className="score-trophy" style={{ color: topic.color }} />
        <div className="score-title">কুইজ সম্পন্ন!</div>

        <div className="score-ring-wrap">
          <svg className="score-ring-svg" width="138" height="138" viewBox="0 0 138 138">
            <circle className="score-ring-bg" cx="69" cy="69" r={r} />
            <circle
              className="score-ring-fill"
              cx="69" cy="69" r={r}
              stroke={topic.color}
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ filter: `drop-shadow(0 0 8px ${topic.color})` }}
            />
          </svg>
          <div className="score-ring-text">
            <div className="score-fraction" style={{ color: topic.color }}>
              {score}<span className="score-total">/{total}</span>
            </div>
            <div className="score-pct">{pct}%</div>
          </div>
        </div>

        <div className="score-msg">{msg}</div>
        <div className="score-actions">
          <button className="score-retry" onClick={onRetry}>আবার চেষ্টা</button>
          <button className="score-home" style={{ background: topic.color }} onClick={onHome}>
            <Home size={15} /> হোম
          </button>
        </div>
      </div>
    </div>
  )
}
