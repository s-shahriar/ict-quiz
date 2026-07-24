import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X, Lightbulb } from 'lucide-react'
import CategoryChipBar from './CategoryChipBar.jsx'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import DeleteButton from './shared/DeleteButton.jsx'
import Pagination from './shared/Pagination'
import { useTrash } from '../contexts/TrashContext.jsx'
import HandToggle from './shared/HandToggle.jsx'

const PAGE_SIZE = 20

export default function ImportantScreen() {
  const navigate = useNavigate()
  useModuleReady('mcq')
  const { value: important, remove: onUnmark, removeMany: onUnmarkMany } = useImportantContext()
  const { trashedIds } = useTrash()
  const [activeId, setActiveId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const topics = TOPICS

  const importantByTopic = topics.map(t => {
    const items = t.questions
      .map((q) => ({ q, qid: q._uid }))
      .filter(({ q }) => q.options && q.correct_answer)
      .filter(({ q, qid }) => important.has(qid) && !trashedIds.has(q._id))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = importantByTopic.reduce((s, g) => s + g.items.length, 0)
  const activeGroup = importantByTopic.find(g => g.topic.id === activeId) || importantByTopic[0]

  const [page, setPage] = useState(1)
  const activeItems = activeGroup?.items ?? []
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageItems = activeItems.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [activeGroup?.topic.id])

  // Remove every important question in the *active* category (confirm-guarded).
  const activeCount = activeGroup?.items.length ?? 0
  const doRemoveActive = () => {
    const ids = (activeGroup?.items ?? []).map(({ qid }) => qid)
    if (ids.length) onUnmarkMany(ids)
    setConfirmOpen(false)
  }

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
        <div className="topbar-right-actions">
          <HandToggle />
        </div>
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

          <CategoryChipBar groups={importantByTopic} activeId={activeGroup?.topic.id} onSelect={setActiveId} />

          {activeGroup && (
            <div className="nailed-screen-list anim-fade" style={{ '--c': activeGroup.topic.color }}>
              <div className="nailed-cat-actions">
                <span className="nailed-cat-actions-label" style={{ color: activeGroup.topic.color }}>
                  {activeGroup.topic.name} · {activeItems.length}
                </span>
                {activeCount > 0 && (
                  <button className="nailed-clear-all-btn" onClick={() => setConfirmOpen(true)}>
                    <X size={12} /> Remove all
                  </button>
                )}
              </div>
              {pageItems.map(({ q, qid }) => (
                <ImportantRow key={qid} q={q} qid={qid} onUnmark={onUnmark} />
              ))}
              {totalPages > 1 && <Pagination page={curPage} totalPages={totalPages} onPageChange={setPage} />}
            </div>
          )}
        </>
      )}

      {confirmOpen && activeGroup && (
        <div className="trash-modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="trash-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="trash-modal-icon" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}>
              <Bookmark size={22} />
            </div>
            <h3 className="trash-modal-title">Remove all — {activeGroup.topic.name}?</h3>
            <p className="trash-modal-sub">
              {activeCount} question{activeCount !== 1 ? 's' : ''} will be removed from Important. You can add them back anytime.
            </p>
            <div className="trash-modal-actions">
              <button className="trash-btn-cancel" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="trash-btn-confirm" onClick={doRemoveActive}>
                <X size={14} /> Remove all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ImportantRow({ q, qid, onUnmark }) {
  const [open, setOpen] = useState(false)   // explanation folded by default
  return (
    <div className="nailed-row">
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
          <>
            <button className="nailed-exp-toggle" onClick={() => setOpen(v => !v)}>
              <Lightbulb size={11} />
              {open ? 'Hide explanation' : 'Show explanation'}
            </button>
            {open && <div className="nailed-row-explanation"><span>{q.explanation}</span></div>}
          </>
        )}
      </div>
      <button className="nailed-unnail-btn" onClick={() => onUnmark(qid)} title="Remove from Important">
        <X size={13} />
      </button>
      <DeleteButton question={q} className="nailed-unnail-btn" iconOnly size={13} />
    </div>
  )
}
