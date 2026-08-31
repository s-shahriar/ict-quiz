import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X, Lightbulb, List, BookOpen } from 'lucide-react'
import CategoryChipBar from './CategoryChipBar.jsx'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import DeleteButton from './shared/DeleteButton.jsx'
import Pagination from './shared/Pagination'
import StudyCard from './shared/StudyCard.jsx'
import { useTrash } from '../contexts/TrashContext.jsx'
import TopbarActions from './shared/TopbarActions.jsx'
import { splitQuestion } from './shared/QuestionText.jsx'

const PAGE_SIZE = 20
// Pseudo-topic id for the "All topics" chip — Important spans many topics, so
// reading straight through the whole set is a first-class case here.
const ALL_ID = '__all__'
const VIEW_KEY = 'importantView'

// Important questions, grouped by topic. Two ways to read them:
//   • List  — the compact rows: question, answer, folded explanation.
//   • Study — the same cards Study Mode uses: tap an option, get the answer and
//     the explanation. Study Mode only ever covers one topic, so cards here
//     carry a topic badge whenever the selection spans more than one.
export default function ImportantScreen() {
  const navigate = useNavigate()
  useModuleReady('mcq')
  const { value: important, add: onMarkImportant, remove: onUnmark, removeMany: onUnmarkMany } = useImportantContext()
  const nailApi = useMasteredContext()
  const { trashedIds } = useTrash()
  const [activeId, setActiveId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'study' ? 'study' : 'list' } catch { return 'list' }
  })
  const setViewPersisted = (v) => {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* private mode — view just won't stick */ }
  }

  const topics = TOPICS

  const importantByTopic = topics.map(t => {
    const items = t.questions
      .map((q) => ({ q, qid: q._uid }))
      .filter(({ q }) => q.options && q.correct_answer)
      .filter(({ q, qid }) => important.has(qid) && !trashedIds.has(q._id))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  const total = importantByTopic.reduce((s, g) => s + g.items.length, 0)
  const multiTopic = importantByTopic.length > 1
  const isAll = multiTopic && activeId === ALL_ID
  const activeGroup = isAll ? null : (importantByTopic.find(g => g.topic.id === activeId) || importantByTopic[0])

  // Items always carry their own topic, so an "All topics" run can colour each
  // card and label it with where it came from.
  const activeItems = isAll
    ? importantByTopic.flatMap(g => g.items.map(it => ({ ...it, topic: g.topic })))
    : (activeGroup?.items ?? []).map(it => ({ ...it, topic: activeGroup.topic }))

  const activeName  = isAll ? 'All topics' : activeGroup?.topic.name
  const activeColor = isAll ? '#ef4444' : activeGroup?.topic.color

  // Back to page 1 whenever the selected chip changes (adjust state during
  // render — avoids setState-in-effect cascading renders).
  const [page, setPage] = useState(1)
  const selectionKey = isAll ? ALL_ID : activeGroup?.topic.id
  const [prevSelection, setPrevSelection] = useState(selectionKey)
  if (prevSelection !== selectionKey) {
    setPrevSelection(selectionKey)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageItems = activeItems.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  const goToPage = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Remove every important question in the *active* category (confirm-guarded).
  // Scoped per-category, so it's hidden while "All topics" is selected.
  const activeCount = activeItems.length
  const doRemoveActive = () => {
    const ids = (activeGroup?.items ?? []).map(({ qid }) => qid)
    if (ids.length) onUnmarkMany(ids)
    setConfirmOpen(false)
  }

  const toggleNail = (qid) => nailApi.value.has(qid) ? nailApi.remove(qid) : nailApi.add(qid)

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
        <TopbarActions />
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
            {view === 'study'
              ? <>These questions still appear in Exam Mode. Tap an option to reveal the answer.</>
              : <>These questions still appear in Exam Mode. Tap <X size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> to remove.</>}
          </div>

          <div className="study-filter-bar saved-view-bar">
            <button
              className={`study-filter-btn${view === 'list' ? ' active' : ''}`}
              onClick={() => setViewPersisted('list')}
              style={view === 'list' ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' } : {}}
            >
              <List size={12} /> List
            </button>
            <button
              className={`study-filter-btn${view === 'study' ? ' active' : ''}`}
              onClick={() => setViewPersisted('study')}
              style={view === 'study' ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' } : {}}
            >
              <BookOpen size={12} /> Study
            </button>
          </div>

          <CategoryChipBar
            groups={importantByTopic}
            activeId={isAll ? ALL_ID : activeGroup?.topic.id}
            onSelect={setActiveId}
            allId={ALL_ID}
          />

          {activeItems.length > 0 && (
            <div className="nailed-screen-list anim-fade" style={{ '--c': activeColor }}>
              <div className="nailed-cat-actions">
                <span className="nailed-cat-actions-label" style={{ color: activeColor }}>
                  {activeName} · {activeItems.length}
                </span>
                {!isAll && activeCount > 0 && (
                  <button className="nailed-clear-all-btn" onClick={() => setConfirmOpen(true)}>
                    <X size={12} /> Remove all
                  </button>
                )}
              </div>

              {view === 'study' ? (
                <div className="study-list">
                  {pageItems.map(({ q, qid, topic: t }, i) => (
                    <StudyCard
                      key={qid}
                      domId={'important-q-' + qid}
                      question={q}
                      index={(curPage - 1) * PAGE_SIZE + i}
                      color={t.color}
                      topicLabel={isAll ? t.name : null}
                      nailed={nailApi.value.has(qid)}
                      isImportant
                      onNail={() => toggleNail(qid)}
                      onMarkImportant={() => onMarkImportant(qid)}
                      onUnmarkImportant={() => onUnmark(qid)}
                    />
                  ))}
                </div>
              ) : (
                pageItems.map(({ q, qid }) => (
                  <ImportantRow key={qid} q={q} qid={qid} onUnmark={onUnmark} />
                ))
              )}

              {totalPages > 1 && <Pagination page={curPage} totalPages={totalPages} onPageChange={goToPage} />}
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
        <span className="nailed-row-text">{splitQuestion(q.question).prompt}</span>
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
