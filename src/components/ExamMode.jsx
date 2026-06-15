import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowRight, Home, Trophy, Lightbulb, OctagonX, Star, Bookmark } from 'lucide-react'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { duplicateQidsOf } from '../lib/questionIndex.js'

export default function ExamMode() {
  const location = useLocation()
  const navigate = useNavigate()
  const { value: mastered, add: onNail, remove: onUnnail } = useMasteredContext()
  const { value: important, add: onMarkImportant, removeMany: onUnmarkImportant } = useImportantContext()

  const { questions, label } = location.state || {}
  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore]       = useState(0)
  const [done, setDone]         = useState(false)
  const [stopConfirm, setStopConfirm] = useState(false)

  if (!questions) return <Navigate to="/exam" replace />

  const goHome = () => navigate('/')

  const handleStop = () => {
    if (stopConfirm) { goHome(); return }
    setStopConfirm(true)
    setTimeout(() => setStopConfirm(false), 3000)
  }

  const q    = questions[idx]
  const opts = q ? ['a','b','c','d'].filter(k => q.options?.[k]) : []
  const qid  = q?._topicId != null ? `${q._topicId}__${q._origIndex}` : null
  // A question can have duplicate copies (different qids). Treat it as important
  // if ANY copy is marked, and unmark every copy so it reliably clears.
  const dupeQids = qid ? duplicateQidsOf(qid) : []
  const isNailed = qid ? mastered?.has(qid) : false
  const isImportant = qid ? dupeQids.some(id => important?.has(id)) : false

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
    setIdx(0); setSelected(null); setRevealed(false); setScore(0); setDone(false)
  }

  if (!q || done) {
    return <ExamScore score={score} total={questions.length} label={label} onRetry={retry} onHome={goHome} />
  }

  const progress  = ((idx + (revealed ? 1 : 0)) / questions.length) * 100
  const isCorrect = selected === q.correct_answer
  const accent    = q._color ?? '#6366f1'

  return (
    <div className="quiz-page anim-fade">
      <div className="quiz-topbar">
        <div className="exam-mode-pill">
          <span style={{ color: accent }}>Exam</span>
          <span className="exam-topic-tag">{q._label ?? label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="quiz-score-pill">{score} / {idx + (revealed ? 1 : 0)}</span>
          <button
            className={`exam-stop-btn${stopConfirm ? ' confirm' : ''}`}
            onClick={handleStop}
            title="Stop exam"
          >
            <OctagonX size={14} />
            {stopConfirm ? 'Sure?' : 'Stop'}
          </button>
        </div>
      </div>

      <div className="quiz-progress-wrap">
        <div className="quiz-progress-header">
          <span className="quiz-qnum">Question {idx + 1} of {questions.length}</span>
          <span className="quiz-pct">{Math.round(progress)}%</span>
        </div>
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{ width: `${progress}%`, background: accent }} />
        </div>
      </div>

      <div className="quiz-card anim-slide">
        <p className="quiz-question">{q.question}</p>

        <div className="quiz-options">
          {opts.map(key => {
            let cls = 'opt-btn'
            if (revealed) {
              if (key === q.correct_answer) cls += ' correct revealed'
              else if (key === selected)    cls += ' wrong revealed'
              else                          cls += ' dim revealed'
            }
            return (
              <button key={key} className={cls} style={{ '--c': accent }} onClick={() => pick(key)}>
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
          <div className="explanation-box anim-slide" style={{ '--c': accent }}>
            <div className="explanation-header">
              <Lightbulb size={14} style={{ color: accent, flexShrink: 0 }} />
              <span className="explanation-label" style={{ color: accent }}>ব্যাখ্যা</span>
              <span className={`answer-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                {isCorrect ? '✓ সঠিক' : '✗ ভুল'}
              </span>
            </div>
            <p className="explanation-text">{q.explanation}</p>
          </div>
        )}

        {revealed && (
          <div className="quiz-revealed-actions">
            {qid && (
              <div className="quiz-mark-btns">
                <button
                  className={`quiz-nail-btn${isNailed ? ' nailed' : ''}`}
                  onClick={() => isNailed ? onUnnail(qid) : onNail(qid)}
                  title={isNailed ? 'Nailed — click to un-nail' : 'Mark as Nailed It'}
                >
                  <Star size={16} fill={isNailed ? 'currentColor' : 'none'} strokeWidth={1.8} />
                  {isNailed ? 'Nailed!' : 'Nail It'}
                </button>
                <button
                  className={`quiz-important-btn${isImportant ? ' marked' : ''}`}
                  onClick={() => isImportant ? onUnmarkImportant(dupeQids) : onMarkImportant(qid)}
                  title={isImportant ? 'Important — click to remove' : 'Mark as Important'}
                >
                  <Bookmark size={16} fill={isImportant ? 'currentColor' : 'none'} strokeWidth={1.8} />
                  {isImportant ? 'Saved!' : 'Important'}
                </button>
              </div>
            )}
            <button className="quiz-next-btn" onClick={next} style={{ background: accent }}>
              {idx + 1 >= questions.length ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ExamScore({ score, total, label, onRetry, onHome }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const msg =
    pct >= 80 ? 'অসাধারণ! Exam এ দারুণ করবে!' :
    pct >= 60 ? 'ভালো হয়েছে! আরেকটু মনোযোগ দাও।' :
    pct >= 40 ? 'আরো অনুশীলন দরকার।' :
                'হাল ছেড়ো না, আবার চেষ্টা করো!'

  const r           = 54
  const circumference = 2 * Math.PI * r
  const strokeOffset  = circumference - (pct / 100) * circumference

  return (
    <div className="score-page anim-fade">
      <div className="score-card">
        <Trophy size={44} className="score-trophy" style={{ color: '#6366f1' }} />
        <div className="score-title">Exam সম্পন্ন!</div>
        <div className="exam-score-label">{label}</div>

        <div className="score-ring-wrap">
          <svg className="score-ring-svg" width="138" height="138" viewBox="0 0 138 138">
            <circle className="score-ring-bg" cx="69" cy="69" r={r} />
            <circle
              className="score-ring-fill"
              cx="69" cy="69" r={r}
              stroke="#6366f1"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{ filter: 'drop-shadow(0 0 8px #6366f1)' }}
            />
          </svg>
          <div className="score-ring-text">
            <div className="score-fraction" style={{ color: '#6366f1' }}>
              {score}<span className="score-total">/{total}</span>
            </div>
            <div className="score-pct">{pct}%</div>
          </div>
        </div>

        <div className="score-msg">{msg}</div>
        <div className="score-actions">
          <button className="score-retry" onClick={onRetry}>আবার দাও</button>
          <button className="score-home" style={{ background: '#6366f1' }} onClick={onHome}>
            <Home size={15} /> হোম
          </button>
        </div>
      </div>
    </div>
  )
}
