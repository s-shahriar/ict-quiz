import { useState } from 'react'
import { Bookmark, CheckCircle, Lightbulb, Star, XCircle } from 'lucide-react'
import QuestionText from './QuestionText.jsx'
import DeleteButton from './DeleteButton.jsx'
import WeakButton from './WeakButton.jsx'
import HighlightableText from './HighlightableText.jsx'
import { useHighlights } from '../../contexts/HighlightContext.jsx'

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
  // MCQ explanations are highlightable, keyed by the same question uid the
  // Written module uses. Block key 'explanation' — an MCQ answer has one text
  // block, so it needs no index.
  const { getFor } = useHighlights()
  const hlExp = q._uid ? getFor(q._uid).filter(h => h.block === 'explanation') : undefined

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
            <span className="study-topic-badge" style={{ color, borderColor: `color-mix(in srgb, ${color} 33%, transparent)`, background: `color-mix(in srgb, ${color} 8%, transparent)` }}>
              {topicLabel}
            </span>
          )}
        </span>
        <div className="study-card-actions">
          <button
            className={`nail-btn${nailed ? ' nailed' : ''}`}
            onClick={onNail}
            title={nailed ? 'Nailed It — click to un-nail' : 'Mark as Nailed It'}
            style={nailed ? { color, borderColor: `color-mix(in srgb, ${color} 38%, transparent)`, background: `color-mix(in srgb, ${color} 8%, transparent)` } : {}}
          >
            <Star size={12} fill={nailed ? 'currentColor' : 'none'} />
            <span className="qmark-label">{nailed ? 'Nailed ✓' : 'Nail It'}</span>
          </button>
          <button
            className={`nail-btn important-study-btn${isImportant ? ' nailed' : ''}`}
            onClick={isImportant ? onUnmarkImportant : onMarkImportant}
            title={isImportant ? 'Important — click to remove' : 'Mark as Important'}
            style={isImportant ? { color: 'var(--imp)', borderColor: 'color-mix(in srgb, var(--imp) 40%, transparent)', background: 'var(--imp-tint)' } : {}}
          >
            <Bookmark size={12} fill={isImportant ? 'currentColor' : 'none'} />
            <span className="qmark-label">{isImportant ? 'Important ✓' : 'Important'}</span>
          </button>
          <WeakButton
            uid={q._uid}
            className="nail-btn weak-study-btn"
            onClass="nailed"
            size={12}
            label
            style={{ color: 'var(--weak)', borderColor: 'color-mix(in srgb, var(--weak) 40%, transparent)', background: 'var(--weak-tint)' }}
          />
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

      <QuestionText text={q.question} uid={q._uid} className="study-question" />

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
            <button key={key} className={cls} onClick={() => pick(key)}>
              <span className="study-opt-key">{key.toUpperCase()}</span>
              <span className="study-opt-text">{q.options[key]}</span>
              {shown && isCorrect && <CheckCircle size={13} style={{ color: 'var(--ok)', marginLeft: 'auto', flexShrink: 0 }} />}
              {shown && isWrong   && <XCircle size={13} style={{ color: 'var(--bad)', marginLeft: 'auto', flexShrink: 0 }} />}
            </button>
          )
        })}
      </div>

      {shown && q.explanation && (
        <div className="explanation-box anim-slide" style={{ '--c': color }} data-hl-root={q._uid || undefined}>
          <div className="explanation-header">
            <Lightbulb size={14} style={{ color, flexShrink: 0 }} />
            <span className="explanation-label" style={{ color }}>ব্যাখ্যা</span>
          </div>
          <HighlightableText as="p" className="explanation-text"
            block="explanation" text={q.explanation} highlights={hlExp} />
        </div>
      )}
    </div>
  )
}
