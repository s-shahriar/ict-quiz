import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, XCircle, ArrowRight, Home, Trophy, Lightbulb, Star, Bookmark, Flame } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useWeakContext } from '../contexts/WeakContext.jsx'
import { useModuleReady } from '../data/contentLoader.js'
import DeleteButton from './shared/DeleteButton.jsx'
import WeakButton from './shared/WeakButton.jsx'
import TopbarActions from './shared/TopbarActions.jsx'
import QuestionText from './shared/QuestionText.jsx'
import HighlightableText from './shared/HighlightableText.jsx'
import { useHighlights } from '../contexts/HighlightContext.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// `?set=important|weak|nailed` quizzes only the questions you've marked in this
// topic (chosen on ModeSelect). No param = the whole topic.
const POOL_LABEL = { important: 'Important', weak: 'Weak', nailed: 'Nailed' }

export default function QuizMode() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const topic = TOPICS.find(t => t.id === topicId)
  const ready = useModuleReady('mcq')
  const { value: mastered, add: nail, remove: unnail } = useMasteredContext()
  const { value: important, add: markImportant, remove: unmarkImportant } = useImportantContext()
  const { value: weak } = useWeakContext()
  const [searchParams] = useSearchParams()
  const setParam = searchParams.get('set')
  const set = POOL_LABEL[setParam] ? setParam : null

  // A marked-set quiz also tracks its set, so it fills in once cloud progress lands.
  const liveQuestions = useMemo(() => {
    if (!topic) return []
    const base = topic.questions.filter(q => q.options && q.correct_answer)
    const marked = set === 'important' ? important : set === 'weak' ? weak : set === 'nailed' ? mastered : null
    return shuffle(marked ? base.filter(q => marked.has(q._uid)) : base)
  }, [topic, ready, set, set === 'important' ? important : null, set === 'weak' ? weak : null, set === 'nailed' ? mastered : null]) // eslint-disable-line react-hooks/exhaustive-deps

  // Frozen at the first answer: un-marking a question mid-quiz must not
  // reshuffle or shrink the quiz you're in the middle of.
  const [frozen, setFrozen] = useState(null)   // { key, list }
  const quizKey = `${topic?.id}|${set || 'all'}`
  const questions = frozen?.key === quizKey ? frozen.list : liveQuestions

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  // Saved highlights, read here with the rest of the hooks — it must run
  // before the early returns below or the hook order changes between renders.
  const { getFor } = useHighlights()

  if (!topic) return <Navigate to="/" replace />
  if (!ready) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-3)', fontSize: '0.85rem' }}>Loading…</div>

  const q = questions[idx]
  const opts = q ? ['a','b','c','d','e'].filter(k => q.options?.[k]) : []
  const qid = q ? q._uid : null
  // Highlights for this question's explanation (block key 'explanation' —
  // an MCQ answer has one text block, so it needs no index).
  const hlExp = qid ? getFor(qid).filter(h => h.block === 'explanation') : undefined
  const isNailed = qid ? mastered?.has(qid) : false
  const isImportant = qid ? important?.has(qid) : false

  const pick = (key) => {
    if (revealed) return
    if (frozen?.key !== quizKey) setFrozen({ key: quizKey, list: questions })
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

  if (set && !questions.length) {
    const PoolIcon = set === 'important' ? Bookmark : set === 'weak' ? Flame : Star
    return (
      <div className="quiz-page anim-fade">
        <div className="quiz-topbar">
          <button className="back-btn" onClick={() => navigate('/mcq/' + topic.id)}><ChevronLeft size={15} /> Back</button>
          <span className="quiz-topic-pill" style={{ color: topic.color }}>{topic.shortName}</span>
          <TopbarActions />
        </div>
        <div className="quiz-pool-empty">
          <PoolIcon size={38} className={`quiz-pool-empty-icon ${set}`} fill="currentColor" />
          <p>{topic.name}-এ এখনো কোনো {POOL_LABEL[set]} প্রশ্ন নেই।</p>
          <button className="back-btn" onClick={() => navigate('/mcq/' + topic.id)}><ChevronLeft size={15} /> ফিরে যাও</button>
        </div>
      </div>
    )
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
        <TopbarActions>
          <span className="quiz-score-pill">{score} pts</span>
        </TopbarActions>
      </div>

      <div className="quiz-progress-wrap">
        <div className="quiz-progress-header">
          <span className="quiz-qnum">
            Question {idx + 1} of {questions.length}
            {set && <span className={`quiz-pool-tag ${set}`}>{POOL_LABEL[set]}</span>}
          </span>
          <span className="quiz-pct">{Math.round(progress)}%</span>
        </div>
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{ '--progress': progress / 100, background: topic.color }} />
        </div>
      </div>

      <div className="quiz-card anim-slide">
        <QuestionText text={q.question} uid={qid} className="quiz-question" />

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

        {revealed && (
          <div className="quiz-revealed-actions">
            <div className="quiz-mark-btns">
              <button
                className={`quiz-nail-btn${isNailed ? ' nailed' : ''}`}
                onClick={() => isNailed ? unnail(qid) : nail(qid)}
                title={isNailed ? 'Nailed — click to un-nail' : 'Mark as Nailed It'}
              >
                <Star size={16} fill={isNailed ? 'currentColor' : 'none'} strokeWidth={1.8} />
                <span className="qmark-label">{isNailed ? 'Nailed!' : 'Nail It'}</span>
              </button>
              <button
                className={`quiz-important-btn${isImportant ? ' marked' : ''}`}
                onClick={() => isImportant ? unmarkImportant(qid) : markImportant(qid)}
                title={isImportant ? 'Important — click to remove' : 'Mark as Important'}
              >
                <Bookmark size={16} fill={isImportant ? 'currentColor' : 'none'} strokeWidth={1.8} />
                <span className="qmark-label">{isImportant ? 'Saved!' : 'Important'}</span>
              </button>
              <WeakButton uid={qid} className="quiz-weak-btn" size={16} label onLabel="Weak!" />
              <DeleteButton question={q} className="quiz-nail-btn" size={16} onDeleted={next} />
            </div>
            <button className="quiz-next-btn" onClick={next}>
              {idx + 1 >= questions.length ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {revealed && q.explanation && (
          <div className="explanation-box anim-slide" data-hl-root={qid || undefined} style={{ '--c': topic.color }}>
            <div className="explanation-header">
              <Lightbulb size={14} style={{ color: topic.color, flexShrink: 0 }} />
              <span className="explanation-label" style={{ color: topic.color }}>ব্যাখ্যা</span>
              <span className={`answer-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                {isCorrect ? '✓ সঠিক' : '✗ ভুল'}
              </span>
            </div>
            <HighlightableText as="p" className="explanation-text"
              block="explanation" text={q.explanation} highlights={hlExp} />
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
