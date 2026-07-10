import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X, Home } from 'lucide-react'
import { getExtraData, EXTRA_TOPICS } from '../data/extra/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { WrittenCardBody } from './WrittenCardBody.jsx'

export default function ExtraImportantScreen() {
  const navigate = useNavigate()
  useModuleReady('extra')
  const { value: important, remove: onUnmark } = useImportantContext()
  const [activeId, setActiveId] = useState(null)

  const importantByTopic = EXTRA_TOPICS.map(t => {
    const data = getExtraData(t.id)
    const items = (data.questions || [])
      .map(q => ({ q, qid: q._uid }))
      .filter(({ qid }) => important.has(qid))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = importantByTopic.reduce((s, g) => s + g.items.length, 0)
  const activeGroup = importantByTopic.find(g => g.topic.id === activeId) || importantByTopic[0]

  return (
    <div className="nailed-screen nailed-screen--wide anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'extra' } })}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Bookmark size={16} fill="currentColor" style={{ color: '#ef4444' }} />
          Important — Extra
        </div>
        <button className="study-home-btn" onClick={() => navigate('/', { state: { module: 'extra' } })} title="Home">
          <Home size={16} />
        </button>
      </div>

      {total === 0 ? (
        <div className="nailed-screen-empty">
          <Bookmark size={48} style={{ color: '#ef4444', opacity: 0.3 }} />
          <p>No important extra questions yet.</p>
          <span>Open any Extra topic and tap the <Bookmark size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on a card to save it here.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total important-total">{total}</span>
            <span className="nailed-screen-total-label">important extra question{total !== 1 ? 's' : ''} across {importantByTopic.length} topic{importantByTopic.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="nailed-cat-bar">
            {importantByTopic.map(({ topic: t, items }) => {
              const Icon = t.icon
              const on = activeGroup?.topic.id === t.id
              return (
                <button
                  key={t.id}
                  className={`nailed-cat-chip${on ? ' active' : ''}`}
                  style={{ '--c': t.color }}
                  onClick={() => setActiveId(t.id)}
                >
                  {Icon && <span className="nailed-cat-chip-ic"><Icon size={16} /></span>}
                  <span className="nailed-cat-chip-name">{t.name}</span>
                  <span className="nailed-cat-chip-count">{items.length}</span>
                </button>
              )
            })}
          </div>

          {activeGroup && (
            <div className="nailed-screen-list anim-fade" style={{ gap: 10 }}>
              {activeGroup.items.map(({ q, qid }) => (
                <ExtraImportantCard key={qid} q={q} qid={qid} topicColor={activeGroup.topic.color} onUnmark={onUnmark} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ExtraImportantCard({ q, qid, topicColor, onUnmark }) {
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
