import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X } from 'lucide-react'
import CategoryChipBar from './CategoryChipBar.jsx'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useWeakContext } from '../contexts/WeakContext.jsx'
import Pagination from './shared/Pagination'
import WeakOnlyBar from './shared/WeakOnlyBar.jsx'
import StudyCard from './shared/StudyCard.jsx'
import { useTrash } from '../contexts/TrashContext.jsx'
import TopbarActions from './shared/TopbarActions.jsx'

const PAGE_SIZE = 20
// Pseudo-topic id for the "All topics" chip — Important spans many topics, so
// reading straight through the whole set is a first-class case here.
const ALL_ID = '__all__'

// Important questions, grouped by topic and read as study cards — the same ones
// Study Mode uses: tap an option, get the answer and the explanation. Study Mode
// only ever covers one topic, so cards here carry a topic badge whenever the
// selection spans more than one.
export default function ImportantScreen() {
  const navigate = useNavigate()
  useModuleReady('mcq')
  const { value: important, add: onMarkImportant, remove: onUnmark, removeMany: onUnmarkMany } = useImportantContext()
  const { value: weak, removeMany: onUnweakMany } = useWeakContext()
  const nailApi = useMasteredContext()
  const { trashedIds } = useTrash()
  const [activeId, setActiveId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [weakOnly, setWeakOnly] = useState(false)

  const topics = TOPICS

  const importantByTopic = topics.map(t => {
    const items = t.questions
      .map((q) => ({ q, qid: q._uid }))
      .filter(({ q }) => q.options && q.correct_answer)
      .filter(({ q, qid }) => important.has(qid) && !trashedIds.has(q._id) && (!weakOnly || weak.has(qid)))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  // Counts for the All / Weak switch, whichever of the two is showing.
  let impTotal = 0
  let weakTotal = 0
  for (const t of topics) {
    for (const q of t.questions) {
      if (!q.options || !q.correct_answer || !important.has(q._uid) || trashedIds.has(q._id)) continue
      impTotal++
      if (weak.has(q._uid)) weakTotal++
    }
  }

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
  const activeColor = isAll ? 'var(--imp)' : activeGroup?.topic.color

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
    if (ids.length) (weakOnly ? onUnweakMany : onUnmarkMany)(ids)
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
          <Bookmark size={16} fill="currentColor" style={{ color: 'var(--imp)' }} />
          Important
        </div>
        <TopbarActions />
      </div>

      {impTotal === 0 ? (
        <div className="nailed-screen-empty">
          <Bookmark size={48} style={{ color: 'var(--imp)', opacity: 0.3 }} />
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
            These questions still appear in Exam Mode. Tap an option to reveal the answer.
          </div>

          <WeakOnlyBar weakOnly={weakOnly} onChange={setWeakOnly} importantCount={impTotal} weakCount={weakTotal} />
          {total === 0 && <div className="nailed-screen-hint">এখনো কোনো Weak প্রশ্ন নেই</div>}

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

              {totalPages > 1 && <Pagination page={curPage} totalPages={totalPages} onPageChange={goToPage} />}
            </div>
          )}
        </>
      )}

      {confirmOpen && activeGroup && (
        <div className="trash-modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="trash-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="trash-modal-icon" style={{ color: 'var(--bad)', background: 'var(--bad-tint)' }}>
              <Bookmark size={22} />
            </div>
            <h3 className="trash-modal-title">Remove all — {activeGroup.topic.name}?</h3>
            <p className="trash-modal-sub">
              {activeCount} question{activeCount !== 1 ? 's' : ''} will be removed from {weakOnly ? 'Weak' : 'Important'}. You can add them back anytime.
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
