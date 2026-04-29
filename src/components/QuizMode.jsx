import { useState, useMemo } from 'react'
import { ChevronLeft, CheckCircle, XCircle, ArrowRight, Home, Trophy, Lightbulb } from 'lucide-react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizMode({ topic, onBack, onHome }) {
  const questions = useMemo(
    () => shuffle(topic.questions.filter(q => q.options && q.correct_answer)).slice(0, Math.min(topic.questions.length, 20)),
    [topic]
  )
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[idx]
  const opts = q ? ['a','b','c','d'].filter(k => q.options?.[k]) : []

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
    return <ScoreScreen score={score} total={questions.length} topic={topic} onRetry={retry} onHome={onHome} />
  }

  const progress = ((idx + (revealed ? 1 : 0)) / questions.length) * 100
  const isCorrect = selected === q.correct_answer

  return (
    <div className="quiz-page anim-fade">
      <div className="quiz-topbar">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={15} /> Back
        </button>
        <span className="quiz-topic-pill" style={{ color: topic.color }}>{topic.shortName}</span>
        <span className="quiz-score-pill">{score} pts</span>
      </div>

      <div className="quiz-progress-track">
        <div className="quiz-progress-fill" style={{ width: `${progress}%`, background: topic.color }} />
      </div>

      <div className="quiz-meta">
        <span className="quiz-qnum">Question {idx + 1} / {questions.length}</span>
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
                  <CheckCircle size={15} className="opt-icon" style={{ color: topic.color }} />
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
          <button
            className="quiz-next-btn"
            style={{ background: topic.color }}
            onClick={next}
          >
            {idx + 1 >= questions.length ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function ScoreScreen({ score, total, topic, onRetry, onHome }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const msg =
    pct >= 80 ? '🎯 অসাধারণ! তুমি দারুণ করেছ!' :
    pct >= 60 ? '👍 ভালো হয়েছে! আরেকটু চেষ্টা করো।' :
    pct >= 40 ? '📚 আরো অনুশীলন করো।' :
                '💪 হাল ছেড়ো না, আবার চেষ্টা করো!'

  return (
    <div className="score-page anim-fade">
      <div className="score-card">
        <Trophy size={46} className="score-trophy" style={{ color: topic.color }} />
        <div className="score-title">কুইজ সম্পন্ন!</div>
        <div className="score-fraction" style={{ color: topic.color }}>
          {score}<span className="score-total">/{total}</span>
        </div>
        <div className="score-pct">{pct}%</div>
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
