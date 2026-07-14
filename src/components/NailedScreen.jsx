import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, X, ChevronDown, ChevronUp, Home, Lightbulb } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import DeleteButton from './shared/DeleteButton.jsx'
import Pagination from './shared/Pagination'
import { useTrash } from '../contexts/TrashContext.jsx'

const PAGE_SIZE = 20

export default function NailedScreen() {
  const navigate = useNavigate()
  useModuleReady('mcq')
  const { value: mastered, remove: onUnnail } = useMasteredContext()
  const { trashedIds } = useTrash()

  const topics = TOPICS

  const nailedByTopic = topics.map(t => {
    const items = t.questions
      .map((q) => ({ q, qid: q._uid }))
      .filter(({ q }) => q.options && q.correct_answer)
      .filter(({ q, qid }) => mastered.has(qid) && !trashedIds.has(q._id))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = nailedByTopic.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="nailed-screen anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Star size={16} fill="currentColor" style={{ color: '#f59e0b' }} />
          Nailed It
        </div>
        <button className="study-home-btn" onClick={() => navigate('/')} title="Home">
          <Home size={16} />
        </button>
      </div>

      {total === 0 ? (
        <div className="nailed-screen-empty">
          <Star size={48} style={{ color: '#f59e0b', opacity: 0.3 }} />
          <p>No questions nailed yet.</p>
          <span>Answer questions in Quiz, Study, or Exam mode and tap <strong>Nail It</strong> to save them here.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total">{total}</span>
            <span className="nailed-screen-total-label">question{total !== 1 ? 's' : ''} nailed across {nailedByTopic.length} topic{nailedByTopic.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="nailed-screen-hint">
            Tap <X size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> to un-nail and return a question to the active pool.
          </div>
          <div className="nailed-screen-list">
            {nailedByTopic.map(({ topic: t, items }) => (
              <NailedTopicGroup key={t.id} topic={t} items={items} onUnnail={onUnnail} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NailedTopicGroup({ topic: t, items, onUnnail }) {
  const [open, setOpen] = useState(true)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageItems = items.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

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
          {pageItems.map(({ q, qid }) => (
            <div key={qid} className="nailed-row">
              <Star size={11} fill="currentColor" style={{ color: '#f59e0b', flexShrink: 0, marginTop: 3 }} />
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
                    <Lightbulb size={11} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
              <button
                className="nailed-unnail-btn"
                onClick={() => onUnnail(qid)}
                title="Un-nail — return to active pool"
              >
                <X size={13} />
              </button>
              <DeleteButton question={q} className="nailed-unnail-btn" iconOnly size={13} />
            </div>
          ))}
          {totalPages > 1 && <Pagination page={curPage} totalPages={totalPages} onPageChange={setPage} />}
        </div>
      )}
    </div>
  )
}
