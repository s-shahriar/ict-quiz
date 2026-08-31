import { useState } from 'react'
import { Bookmark, CheckCircle, Lightbulb, Star, XCircle } from 'lucide-react'
import QuestionText from './QuestionText.jsx'
import DeleteButton from './DeleteButton.jsx'

// One study-mode question card: prompt, tappable options that reveal the answer,
// and the explanation. Shared by StudyMode (single topic) and the Important
// screen, where the saved set can span several topics — those pass `topicLabel`
// so each card still says which topic it came from.
export default function StudyCard({
  domId,
  question: q,
  index,
  color,
  topicLabel,
  nailed,
  isImportant,
  onNail,
  onMarkImportant,
  onUnmarkImportant,
}) {
  const [shown, setShown]       = useState(false)
  const [selected, setSelected] = useState(null)
  const opts = ['a','b','c','d','e'].filter(k => q.options?.[k])

  const pick = (key) => {
    if (shown) return
    setSelected(key)
    setShown(true)
  }

  return (
    <div id={domId} className={`study-card${nailed ? ' study-card-nailed' : ''}`} style={{ '--c': color }}>
      <div className="study-card-top">
        <span className="study-card-lead">
          <span className="study-qnum" style={{ color }}>Q{index + 1}</span>
          {topicLabel && (
            <span className="study-topic-badge" style={{ color, borderColor: `${color}55`, background: `${color}14` }}>
              {topicLabel}
            </span>
          )}
        </span>
        <div className="study-card-actions">
          <button
            className={`nail-btn${nailed ? ' nailed' : ''}`}
            onClick={onNail}
            title={nailed ? 'Nailed It — click to un-nail' : 'Mark as Nailed It'}
            style={nailed ? { color, borderColor: `${color}60`, background: `${color}15` } : {}}
          >
            <Star size={12} fill={nailed ? 'currentColor' : 'none'} />
            <span className="qmark-label">{nailed ? 'Nailed ✓' : 'Nail It'}</span>
          </button>
          <button
            className={`nail-btn important-study-btn${isImportant ? ' nailed' : ''}`}
            onClick={isImportant ? onUnmarkImportant : onMarkImportant}
            title={isImportant ? 'Important — click to remove' : 'Mark as Important'}
            style={isImportant ? { color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)' } : {}}
          >
            <Bookmark size={12} fill={isImportant ? 'currentColor' : 'none'} />
            <span className="qmark-label">{isImportant ? 'Important ✓' : 'Important'}</span>
          </button>
          <DeleteButton question={q} className="nail-btn" size={12} />
          {shown && (
            <button
              className="study-toggle"
              onClick={() => { setShown(false); setSelected(null) }}
              style={{ color }}
            >
              লুকাও
            </button>
          )}
        </div>
      </div>

      <QuestionText text={q.question} className="study-question" />

      <div className="study-options">
        {opts.map(key => {
          const isCorrect = key === q.correct_answer
          const isWrong   = shown && key === selected && !isCorrect
          let cls = 'study-opt study-opt-clickable'
          if (shown) {
            if (isCorrect)  cls += ' correct'
            else if (isWrong) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button key={key} className={cls} style={isCorrect && shown ? { '--c': color } : {}} onClick={() => pick(key)}>
              <span className="study-opt-key">{key.toUpperCase()}</span>
              <span className="study-opt-text">{q.options[key]}</span>
              {shown && isCorrect && <CheckCircle size={13} style={{ color, marginLeft: 'auto', flexShrink: 0 }} />}
              {shown && isWrong   && <XCircle size={13} style={{ color: '#ef4444', marginLeft: 'auto', flexShrink: 0 }} />}
            </button>
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
