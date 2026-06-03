import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X, ChevronDown, ChevronUp, Home } from 'lucide-react'
import { getWrittenData, WRITTEN_TOPICS } from '../data/written/index.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { WrittenCardBody } from './WrittenCardBody.jsx'

export default function WrittenImportantScreen() {
  const navigate = useNavigate()
  const { value: important, remove: onUnmark } = useImportantContext()

  const importantByTopic = WRITTEN_TOPICS.map(t => {
    const data = getWrittenData(t.id)
    const items = (data.questions || [])
      .map(q => ({ q, qid: `written__${t.id}__${q.id}` }))
      .filter(({ qid }) => important.has(qid))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = importantByTopic.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="nailed-screen nailed-screen--wide anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'written' } })}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Bookmark size={16} fill="currentColor" style={{ color: '#ef4444' }} />
          Important — Written
        </div>
        <button className="study-home-btn" onClick={() => navigate('/', { state: { module: 'written' } })} title="Home">
          <Home size={16} />
        </button>
      </div>

      {total === 0 ? (
        <div className="nailed-screen-empty">
          <Bookmark size={48} style={{ color: '#ef4444', opacity: 0.3 }} />
          <p>No important written questions yet.</p>
          <span>Open any Written topic and tap the <Bookmark size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on a card to save it here.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total important-total">{total}</span>
            <span className="nailed-screen-total-label">important written question{total !== 1 ? 's' : ''} across {importantByTopic.length} topic{importantByTopic.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="nailed-screen-list">
            {importantByTopic.map(({ topic: t, items }) => (
              <WrittenImportantGroup key={t.id} topic={t} items={items} onUnmark={onUnmark} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function WrittenImportantGroup({ topic: t, items, onUnmark }) {
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
        <div className="nailed-group-body anim-slide" style={{ padding: '8px 6px 10px', gap: 10 }}>
          {items.map(({ q, qid }) => (
            <WrittenImportantCard key={qid} q={q} qid={qid} topicColor={t.color} onUnmark={onUnmark} />
          ))}
        </div>
      )}
    </div>
  )
}

function WrittenImportantCard({ q, qid, topicColor, onUnmark }) {
  return (
    <div className="written-card open" style={{ '--c': topicColor }}>
      <div className="written-card-header">
        <div className="written-card-toggle" style={{ cursor: 'default' }}>
          <span className="written-qtext" style={{ paddingTop: 2 }}>{q.q}</span>
        </div>
        <button
          className="nailed-unnail-btn"
          onClick={() => onUnmark(qid)}
          title="Remove from Important"
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          <X size={13} />
        </button>
      </div>
      <WrittenCardBody a={q.answer} topicColor={topicColor} />
    </div>
  )
}
