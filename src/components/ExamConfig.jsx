import { useState, useMemo } from 'react'
import { ChevronLeft, Zap, Minus, Plus } from 'lucide-react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ExamConfig({ topics, important, onStart, onBack }) {
  const [topicId, setTopicId] = useState('all')
  const [count, setCount] = useState(10)

  const validQ = (q) => q.options && q.correct_answer

  const importantCount = useMemo(() =>
    topics.reduce((s, t) =>
      s + t.questions.filter((q, i) => validQ(q) && important.has(`${t.id}__${i}`)).length
    , 0)
  , [important, topics])

  const maxCount = useMemo(() => {
    if (topicId === 'important')
      return importantCount
    if (topicId === 'all')
      return topics.reduce((s, t) => s + t.questions.filter(validQ).length, 0)
    return topics.find(t => t.id === topicId)?.questions.filter(validQ).length ?? 0
  }, [topicId, topics, importantCount])

  const safeCount = Math.max(1, Math.min(count, maxCount))

  const adjust = (delta) => setCount(c => Math.max(1, Math.min(c + delta, maxCount)))

  const handleTopicChange = (val) => {
    setTopicId(val)
    setCount(val === 'important' ? 9999 : 10)
  }

  const handleStart = () => {
    let pool
    if (topicId === 'important') {
      pool = topics.flatMap(t =>
        t.questions
          .map((q, i) => ({ ...q, _color: t.color, _label: t.shortName, _topicId: t.id, _origIndex: i }))
          .filter(q => validQ(q) && important.has(`${q._topicId}__${q._origIndex}`))
      )
    } else if (topicId === 'all') {
      pool = topics.flatMap(t =>
        t.questions.map((q, i) => ({ ...q, _color: t.color, _label: t.shortName, _topicId: t.id, _origIndex: i }))
          .filter(q => validQ(q))
      )
    } else {
      const t = topics.find(t => t.id === topicId)
      pool = t.questions
        .map((q, i) => ({ ...q, _color: t.color, _label: t.shortName, _topicId: t.id, _origIndex: i }))
        .filter(q => validQ(q))
    }
    const questions = shuffle(pool).slice(0, safeCount)
    const label = topicId === 'important' ? 'Important Questions'
      : topicId === 'all' ? 'All Topics'
      : topics.find(t => t.id === topicId)?.name
    onStart({ questions, label })
  }

  return (
    <div className="exam-config-page anim-fade">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={15} /> Back
      </button>

      <div className="exam-config-hero">
        <div className="exam-config-icon">
          <Zap size={30} />
        </div>
        <h1 className="exam-config-title">Exam Mode</h1>
        <p className="exam-config-sub">নিজেকে পরীক্ষা করো — topic বেছে, question সংখ্যা ঠিক করো</p>
      </div>

      <div className="exam-config-form">
        <div className="exam-field">
          <label className="exam-label">Topic</label>
          <select
            className="exam-select"
            value={topicId}
            onChange={e => handleTopicChange(e.target.value)}
          >
            <option value="all">🎲 All Topics (Random Mix)</option>
            <option value="important" disabled={importantCount === 0}>
              🔖 Important Questions ({importantCount} Q)
            </option>
            <optgroup label="────────────────">
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.questions.filter(validQ).length} Q)
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="exam-field">
          <label className="exam-label">
            Number of Questions
            <span className="exam-max-hint">max {maxCount}</span>
          </label>
          <div className="exam-count-row">
            <button className="exam-stepper" onClick={() => adjust(-5)} disabled={safeCount <= 1}>−5</button>
            <button className="exam-stepper" onClick={() => adjust(-1)} disabled={safeCount <= 1}>
              <Minus size={14} />
            </button>
            <span className="exam-count-display">{safeCount}</span>
            <button className="exam-stepper" onClick={() => adjust(1)} disabled={safeCount >= maxCount}>
              <Plus size={14} />
            </button>
            <button className="exam-stepper" onClick={() => adjust(5)} disabled={safeCount >= maxCount}>+5</button>
          </div>
        </div>

        <button className="exam-start-btn" onClick={handleStart} disabled={maxCount === 0}>
          <Zap size={16} />
          Start Exam — {safeCount} Questions
        </button>
      </div>
    </div>
  )
}
