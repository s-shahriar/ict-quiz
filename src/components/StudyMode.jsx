import { useState } from 'react'
import { ChevronLeft, Home, Eye, EyeOff, CheckCircle, Lightbulb } from 'lucide-react'

export default function StudyMode({ topic, onBack, onHome }) {
  const questions = topic.questions.filter(q => q.options && q.correct_answer)

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

      <div className="study-list">
        {questions.map((q, i) => (
          <StudyCard key={q.id ?? i} question={q} index={i} color={topic.color} />
        ))}
      </div>
    </div>
  )
}

function StudyCard({ question: q, index, color }) {
  const [shown, setShown] = useState(false)
  const opts = ['a','b','c','d'].filter(k => q.options?.[k])

  return (
    <div className="study-card" style={{ '--c': color }}>
      <div className="study-card-top">
        <span className="study-qnum" style={{ color }}>Q{index + 1}</span>
        <button
          className="study-toggle"
          onClick={() => setShown(v => !v)}
          style={{ color: shown ? color : 'var(--text-2)' }}
        >
          {shown ? <Eye size={12} /> : <EyeOff size={12} />}
          {shown ? 'লুকাও' : 'উত্তর দেখো'}
        </button>
      </div>

      <p className="study-question">{q.question}</p>

      <div className="study-options">
        {opts.map(key => {
          const isCorrect = shown && key === q.correct_answer
          return (
            <div
              key={key}
              className={`study-opt${isCorrect ? ' correct' : ''}`}
              style={isCorrect ? { color } : {}}
            >
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
