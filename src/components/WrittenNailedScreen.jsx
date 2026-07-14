import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, X, ChevronDown, ChevronUp, Home } from 'lucide-react'
import { getWrittenData, WRITTEN_TOPICS } from '../data/written/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useWrittenMasteredContext } from '../contexts/WrittenMasteredContext.jsx'
import { WrittenCardBody } from './WrittenCardBody.jsx'
import DeleteButton from './shared/DeleteButton.jsx'
import { useTrash } from '../contexts/TrashContext.jsx'

export default function WrittenNailedScreen() {
  const navigate = useNavigate()
  useModuleReady('written')
  const { value: writtenMastered, remove: onUnnail } = useWrittenMasteredContext()
  const { trashedIds } = useTrash()

  const nailedByTopic = WRITTEN_TOPICS.map(t => {
    const data = getWrittenData(t.id)
    const items = (data.questions || [])
      .map(q => ({ q, qid: q._uid }))
      .filter(({ q, qid }) => writtenMastered.has(qid) && !trashedIds.has(q._id))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = nailedByTopic.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="nailed-screen nailed-screen--wide anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'written' } })}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Star size={16} fill="currentColor" style={{ color: '#f59e0b' }} />
          Nailed It — Written
        </div>
        <button className="study-home-btn" onClick={() => navigate('/', { state: { module: 'written' } })} title="Home">
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
        <div className="nailed-group-body anim-slide" style={{ padding: '8px 6px 10px', gap: 10 }}>
          {items.map(({ q, qid }) => (
            <WrittenNailedCard key={qid} q={q} qid={qid} topicColor={t.color} onUnnail={onUnnail} />
          ))}
        </div>
      )}
    </div>
  )
}

function WrittenNailedCard({ q, qid, topicColor, onUnnail }) {
  return (
    <div className="written-card open" style={{ '--c': topicColor }}>
      <div className="written-card-header">
        <div className="written-card-toggle" style={{ cursor: 'default' }}>
          <span className="written-qtext" style={{ paddingTop: 2 }}>{q.q}</span>
        </div>
        <button
          className="nailed-unnail-btn"
          onClick={() => onUnnail(qid)}
          title="Un-nail"
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          <X size={13} />
        </button>
        <DeleteButton question={q} className="nailed-unnail-btn" iconOnly size={13} />
      </div>
      <WrittenCardBody a={q.answer} topicColor={topicColor} />
    </div>
  )
}
