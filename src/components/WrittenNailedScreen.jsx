import { useState } from 'react'
import { ChevronLeft, Star, X, ChevronDown, ChevronUp, Home, PenLine } from 'lucide-react'
import { getWrittenData } from '../data/written/index.js'

export default function WrittenNailedScreen({ writtenTopics, writtenMastered, onUnnail, onHome }) {
  const nailedByTopic = writtenTopics.map(t => {
    const data = getWrittenData(t.id)
    const items = (data.questions || [])
      .map(q => ({ q, qid: `written__${t.id}__${q.id}` }))
      .filter(({ qid }) => writtenMastered.has(qid))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = nailedByTopic.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="nailed-screen anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={onHome}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Star size={16} fill="currentColor" style={{ color: '#f59e0b' }} />
          Nailed It — Written
        </div>
        <button className="study-home-btn" onClick={onHome} title="Home">
          <Home size={16} />
        </button>
      </div>

      {total === 0 ? (
        <div className="nailed-screen-empty">
          <Star size={48} style={{ color: '#f59e0b', opacity: 0.3 }} />
          <p>No written questions nailed yet.</p>
          <span>Open any Written topic and tap the <Star size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on a card to mark it as nailed.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total">{total}</span>
            <span className="nailed-screen-total-label">written question{total !== 1 ? 's' : ''} nailed across {nailedByTopic.length} topic{nailedByTopic.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="nailed-screen-hint">
            Tap <X size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> to un-nail.
          </div>
          <div className="nailed-screen-list">
            {nailedByTopic.map(({ topic: t, items }) => (
              <WrittenNailedGroup key={t.id} topic={t} items={items} onUnnail={onUnnail} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function WrittenNailedGroup({ topic: t, items, onUnnail }) {
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
              <PenLine size={11} style={{ color: t.color, flexShrink: 0, marginTop: 3 }} />
              <div className="nailed-row-body">
                <span className="nailed-row-text">{q.q}</span>
                {q.answer?.summary && (
                  <div className="nailed-row-explanation">
                    <span>{q.answer.summary}</span>
                  </div>
                )}
              </div>
              <button
                className="nailed-unnail-btn"
                onClick={() => onUnnail(qid)}
                title="Un-nail"
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
