import { useState } from 'react'
import { ChevronLeft, Home, Eye, EyeOff, CheckCircle, Lightbulb, Star, Bookmark } from 'lucide-react'

export default function StudyMode({ topic, mastered, important, onNail, onMarkImportant, onUnmarkImportant, onBack, onHome }) {
  const allQ = topic.questions
    .map((q, i) => ({ q, qid: `${topic.id}__${i}` }))
    .filter(({ q }) => q.options && q.correct_answer)

  const visible  = allQ.filter(({ qid }) => !mastered.has(qid))
  const nailedCt = allQ.length - visible.length

  return (
    <div className="study-page anim-fade">
      <div className="study-topbar">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={15} /> Back
        </button>
        <span className="study-title" style={{ color: topic.color }}>{topic.name}</span>
        <button className="study-home-btn" onClick={onHome} title="Home">
          <Home size={16} />
        </button>
      </div>

      {nailedCt > 0 && (
        <div className="nailed-notice" style={{ borderColor: `${topic.color}40`, color: topic.color }}>
          <Star size={13} fill="currentColor" />
          <span>{nailedCt} টি question Nailed — <button onClick={onHome} className="nailed-notice-link">Nailed It</button> এ দেখো</span>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="study-all-nailed">
          <Star size={38} style={{ color: topic.color, opacity: 0.5, marginBottom: 12 }} fill="currentColor" />
          <p>সব প্রশ্ন Nailed করা হয়েছে! 🎉</p>
          <button className="back-btn" style={{ marginTop: 16 }} onClick={onHome}>হোমে ফিরে যাও</button>
        </div>
      ) : (
        <div className="study-list">
          {visible.map(({ q, qid }, i) => (
            <StudyCard
              key={qid}
              question={q}
              index={i}
              color={topic.color}
              nailed={mastered.has(qid)}
              isImportant={important?.has(qid) ?? false}
              onNail={() => onNail(qid)}
              onMarkImportant={() => onMarkImportant?.(qid)}
              onUnmarkImportant={() => onUnmarkImportant?.(qid)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StudyCard({ question: q, index, color, nailed, isImportant, onNail, onMarkImportant, onUnmarkImportant }) {
  const [shown, setShown] = useState(false)
  const opts = ['a','b','c','d'].filter(k => q.options?.[k])

  return (
    <div className={`study-card${nailed ? ' study-card-nailed' : ''}`} style={{ '--c': color }}>
      <div className="study-card-top">
        <span className="study-qnum" style={{ color }}>Q{index + 1}</span>
        <div className="study-card-actions">
          <button
            className={`nail-btn${nailed ? ' nailed' : ''}`}
            onClick={onNail}
            title={nailed ? 'Nailed It — click to un-nail' : 'Mark as Nailed It'}
            style={nailed ? { color, borderColor: `${color}60`, background: `${color}15` } : {}}
          >
            <Star size={12} fill={nailed ? 'currentColor' : 'none'} />
            {nailed ? 'Nailed ✓' : 'Nail It'}
          </button>
          <button
            className={`nail-btn important-study-btn${isImportant ? ' nailed' : ''}`}
            onClick={isImportant ? onUnmarkImportant : onMarkImportant}
            title={isImportant ? 'Important — click to remove' : 'Mark as Important'}
            style={isImportant ? { color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)' } : {}}
          >
            <Bookmark size={12} fill={isImportant ? 'currentColor' : 'none'} />
            {isImportant ? 'Important ✓' : 'Important'}
          </button>
          <button
            className="study-toggle"
            onClick={() => setShown(v => !v)}
            style={{ color: shown ? color : 'var(--text-2)' }}
          >
            {shown ? <Eye size={12} /> : <EyeOff size={12} />}
            {shown ? 'লুকাও' : 'উত্তর দেখো'}
          </button>
        </div>
      </div>

      <p className="study-question">{q.question}</p>

      <div className="study-options">
        {opts.map(key => {
          const isCorrect = shown && key === q.correct_answer
          return (
            <div key={key} className={`study-opt${isCorrect ? ' correct' : ''}`} style={isCorrect ? { color } : {}}>
              <span className="study-opt-key">{key.toUpperCase()}</span>
              <span className="study-opt-text">{q.options[key]}</span>
              {isCorrect && <CheckCircle size={13} style={{ color, marginLeft: 'auto', flexShrink: 0 }} />}
            </div>
          )
        })}
      </div>

      {shown && q.explanation && (
        <div className="explanation-box anim-slide" style={{ '--c': color }}>
          <div className="explanation-header">
            <Lightbulb size={14} style={{ color, flexShrink: 0 }} />
            <span className="explanation-label" style={{ color }}>ব্যাখ্যা</span>
          </div>
          <p className="explanation-text">{q.explanation}</p>
        </div>
      )}
    </div>
  )
}
