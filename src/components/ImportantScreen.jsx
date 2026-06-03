import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X, ChevronDown, ChevronUp, Home, Lightbulb } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'

export default function ImportantScreen() {
  const navigate = useNavigate()
  const { value: important, remove: onUnmark } = useImportantContext()

  const topics = TOPICS

  const importantByTopic = topics.map(t => {
    const items = t.questions
      .map((q, i) => ({ q, qid: `${t.id}__${i}` }))
      .filter(({ q }) => q.options && q.correct_answer)
      .filter(({ qid }) => important.has(qid))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = importantByTopic.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="nailed-screen anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Bookmark size={16} fill="currentColor" style={{ color: '#ef4444' }} />
          Important
        </div>
        <button className="study-home-btn" onClick={() => navigate('/')} title="Home">
          <Home size={16} />
        </button>
      </div>

      {total === 0 ? (
        <div className="nailed-screen-empty">
          <Bookmark size={48} style={{ color: '#ef4444', opacity: 0.3 }} />
          <p>No important questions yet.</p>
          <span>Answer questions in Quiz, Study, or Exam mode and tap <strong>Important</strong> to save them here. These will still appear in Exam Mode.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total important-total">{total}</span>
            <span className="nailed-screen-total-label">important question{total !== 1 ? 's' : ''} across {importantByTopic.length} topic{importantByTopic.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="nailed-screen-hint">
            These questions still appear in Exam Mode. Tap <X size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> to remove.
          </div>
          <div className="nailed-screen-list">
            {importantByTopic.map(({ topic: t, items }) => (
              <ImportantTopicGroup key={t.id} topic={t} items={items} onUnmark={onUnmark} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ImportantTopicGroup({ topic: t, items, onUnmark }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="nailed-group" style={{ '--c': t.color }}>
      <button className="nailed-group-header" onClick={() => setOpen(v => !v)}>
        <div className="nailed-group-label">
          <span className="nailed-group-dot" style={{ background: t.color }} />
          <span style={{ color: t.color }}>{t.name}</span>
          <span className="nailed-group-badge" style={{ background: `${t.color}20`, color: t.color }}>
            {items.length}
          </span>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="nailed-group-body anim-slide">
          {items.map(({ q, qid }) => (
            <div key={qid} className="nailed-row">
              <Bookmark size={11} fill="currentColor" style={{ color: '#ef4444', flexShrink: 0, marginTop: 3 }} />
              <div className="nailed-row-body">
                <span className="nailed-row-text">{q.question}</span>
                {q.correct_answer && q.options?.[q.correct_answer] && (
                  <div className="nailed-row-answer">
                    <span className="nailed-ans-key">{q.correct_answer.toUpperCase()}</span>
                    <span className="nailed-ans-text">{q.options[q.correct_answer]}</span>
                  </div>
                )}
                {q.explanation && (
                  <div className="nailed-row-explanation">
                    <Lightbulb size={11} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
              <button
                className="nailed-unnail-btn"
                onClick={() => onUnmark(qid)}
                title="Remove from Important"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
