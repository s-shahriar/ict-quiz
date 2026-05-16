import { useState } from 'react'
import { ChevronLeft, Home, CheckCircle, XCircle, Lightbulb, Star, Bookmark, Filter } from 'lucide-react'

export default function StudyMode({ topic, mastered, important, onNail, onMarkImportant, onUnmarkImportant, onBack, onHome }) {
  const [filterImportant, setFilterImportant] = useState(false)

  const allQ = topic.questions
    .map((q, i) => ({ q, qid: `${topic.id}__${i}` }))
    .filter(({ q }) => q.options && q.correct_answer)

  const nonNailed = allQ.filter(({ qid }) => !mastered.has(qid))
  const nailedCt  = allQ.length - nonNailed.length

  const importantCount = nonNailed.filter(({ qid }) => important?.has(qid)).length

  const visible = filterImportant
    ? nonNailed.filter(({ qid }) => important?.has(qid))
    : nonNailed

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

      {/* Filter bar */}
      <div className="study-filter-bar">
        <button
          className={`study-filter-btn${!filterImportant ? ' active' : ''}`}
          onClick={() => setFilterImportant(false)}
          style={!filterImportant ? { borderColor: topic.color, color: topic.color, background: `${topic.color}15` } : {}}
        >
          সব ({nonNailed.length})
        </button>
        <button
          className={`study-filter-btn${filterImportant ? ' active' : ''}`}
          onClick={() => setFilterImportant(true)}
          style={filterImportant ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' } : {}}
        >
          <Bookmark size={11} fill={filterImportant ? 'currentColor' : 'none'} />
          Important ({importantCount})
        </button>
      </div>

      {nailedCt > 0 && !filterImportant && (
        <div className="nailed-notice" style={{ borderColor: `${topic.color}40`, color: topic.color }}>
          <Star size={13} fill="currentColor" />
          <span>{nailedCt} টি question Nailed — <button onClick={onHome} className="nailed-notice-link">Nailed It</button> এ দেখো</span>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="study-all-nailed">
          {filterImportant
            ? <Bookmark size={38} style={{ color: '#ef4444', opacity: 0.4, marginBottom: 12 }} fill="currentColor" />
            : <Star size={38} style={{ color: topic.color, opacity: 0.5, marginBottom: 12 }} fill="currentColor" />
          }
          <p>{filterImportant ? 'কোনো Important প্রশ্ন নেই।' : 'সব প্রশ্ন Nailed করা হয়েছে! 🎉'}</p>
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
  const [shown, setShown]       = useState(false)
  const [selected, setSelected] = useState(null)
  const opts = ['a','b','c','d'].filter(k => q.options?.[k])

  const pick = (key) => {
    if (shown) return
    setSelected(key)
    setShown(true)
  }

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

      <p className="study-question">{q.question}</p>

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
