import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, X, ChevronDown, ChevronUp } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import Pagination from './shared/Pagination'
import StudyCard from './shared/StudyCard.jsx'
import { useTrash } from '../contexts/TrashContext.jsx'
import TopbarActions from './shared/TopbarActions.jsx'

const PAGE_SIZE = 20

// Nailed questions, grouped by topic and read as study cards — the same ones
// Study Mode uses: tap an option, get the answer and the explanation.
export default function NailedScreen() {
  const navigate = useNavigate()
  useModuleReady('mcq')
  const { value: mastered, remove: onUnnail, removeMany: onUnnailMany } = useMasteredContext()
  const importantApi = useImportantContext()
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
        <TopbarActions />
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
            Tap an option to reveal the answer.
          </div>
          <div className="nailed-screen-list">
            {nailedByTopic.map(({ topic: t, items }) => (
              <NailedTopicGroup key={t.id} topic={t} items={items} onUnnail={onUnnail} onUnnailMany={onUnnailMany} importantApi={importantApi} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NailedTopicGroup({ topic: t, items, onUnnail, onUnnailMany, importantApi }) {
  const [open, setOpen] = useState(true)
  const [page, setPage] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageItems = items.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  // Un-nail every question in *this* category only (confirm-guarded via modal).
  const doUnnailAll = () => {
    const ids = items.map(({ qid }) => qid)
    if (ids.length) onUnnailMany(ids)
    setConfirmOpen(false)
  }

  return (
    <div className="nailed-group" style={{ '--c': t.color }}>
      <div className="nailed-group-headrow">
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
        <button className="nailed-clear-all-btn" onClick={() => setConfirmOpen(true)} title={`Un-nail all in ${t.name}`}>
          <X size={12} /> Un-nail all
        </button>
      </div>

      {open && (
        <div className="nailed-group-body anim-slide study-list">
          {pageItems.map(({ q, qid }, i) => (
            <StudyCard
              key={qid}
              domId={'nailed-q-' + qid}
              question={q}
              index={(curPage - 1) * PAGE_SIZE + i}
              color={t.color}
              nailed
              isImportant={importantApi.value.has(qid)}
              onNail={() => onUnnail(qid)}
              onMarkImportant={() => importantApi.add(qid)}
              onUnmarkImportant={() => importantApi.remove(qid)}
            />
          ))}
          {totalPages > 1 && <Pagination page={curPage} totalPages={totalPages} onPageChange={setPage} />}
        </div>
      )}

      {confirmOpen && (
        <div className="trash-modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="trash-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="trash-modal-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)' }}>
              <Star size={22} />
            </div>
            <h3 className="trash-modal-title">Un-nail all — {t.name}?</h3>
            <p className="trash-modal-sub">
              {items.length} question{items.length !== 1 ? 's' : ''} will return to the active pool. You can nail them again anytime.
            </p>
            <div className="trash-modal-actions">
              <button className="trash-btn-cancel" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="trash-btn-confirm" onClick={doUnnailAll}>
                <X size={14} /> Un-nail all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
