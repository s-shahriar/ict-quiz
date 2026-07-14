import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X, Home, Lightbulb } from 'lucide-react'
import CategoryChipBar from './CategoryChipBar.jsx'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import DeleteButton from './shared/DeleteButton.jsx'
import Pagination from './shared/Pagination'
import { useTrash } from '../contexts/TrashContext.jsx'

const PAGE_SIZE = 20

export default function ImportantScreen() {
  const navigate = useNavigate()
  useModuleReady('mcq')
  const { value: important, remove: onUnmark } = useImportantContext()
  const { trashedIds } = useTrash()
  const [activeId, setActiveId] = useState(null)

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

          <CategoryChipBar groups={importantByTopic} activeId={activeGroup?.topic.id} onSelect={setActiveId} />

          {activeGroup && (
            <div className="nailed-screen-list anim-fade" style={{ '--c': activeGroup.topic.color }}>
              {pageItems.map(({ q, qid }) => (
                <ImportantRow key={qid} q={q} qid={qid} onUnmark={onUnmark} />
              ))}
              {totalPages > 1 && <Pagination page={curPage} totalPages={totalPages} onPageChange={setPage} />}
            </div>
          )}
        </>
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
