import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bookmark, X } from 'lucide-react'
import CategoryChipBar from './CategoryChipBar.jsx'
import { getCodeData, CODE_TOPICS } from '../data/code/index.js'
import { useModuleReady } from '../data/contentLoader.js'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useWeakContext } from '../contexts/WeakContext.jsx'
import { WrittenCardBody } from './WrittenCardBody.jsx'
import DeleteButton from './shared/DeleteButton.jsx'
import WeakButton from './shared/WeakButton.jsx'
import WeakOnlyBar from './shared/WeakOnlyBar.jsx'
import Pagination from './shared/Pagination'
import { useTrash } from '../contexts/TrashContext.jsx'
import TopbarActions from './shared/TopbarActions.jsx'
import WrittenQuestionText from './shared/WrittenQuestionText.jsx'

const PAGE_SIZE = 20

export default function CodeImportantScreen() {
  const navigate = useNavigate()
  useModuleReady('code')
  const { value: important, remove: onUnmark } = useImportantContext()
  const { value: weak, remove: onUnweak } = useWeakContext()
  const { trashedIds } = useTrash()
  const [activeId, setActiveId] = useState(null)
  const [weakOnly, setWeakOnly] = useState(false)

  const importantByTopic = CODE_TOPICS.map(t => {
    const data = getCodeData(t.id)
    const items = (data.questions || [])
      .map(q => ({ q, qid: q._uid }))
      .filter(({ q, qid }) => important.has(qid) && !trashedIds.has(q._id) && (!weakOnly || weak.has(qid)))
    return { topic: t, items }
  }).filter(g => g.items.length > 0)

  // Counts for the All / Weak switch, whichever of the two is showing.
  let impTotal = 0
  let weakTotal = 0
  for (const t of CODE_TOPICS) {
    for (const q of getCodeData(t.id).questions || []) {
      if (!important.has(q._uid) || trashedIds.has(q._id)) continue
      impTotal++
      if (weak.has(q._uid)) weakTotal++
    }
  }

  const total = importantByTopic.reduce((s, g) => s + g.items.length, 0)
  const activeGroup = importantByTopic.find(g => g.topic.id === activeId) || importantByTopic[0]

  const [page, setPage] = useState(1)
  const activeItems = activeGroup?.items ?? []
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const pageItems = activeItems.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [activeGroup?.topic.id])

  return (
    <div className="nailed-screen nailed-screen--wide anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'code' } })}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Bookmark size={16} fill="currentColor" style={{ color: 'var(--imp)' }} />
          Important — Code
        </div>
        <TopbarActions />
      </div>

      {impTotal === 0 ? (
        <div className="nailed-screen-empty">
          <Bookmark size={48} style={{ color: 'var(--imp)', opacity: 0.3 }} />
          <p>No important programs yet.</p>
          <span>Open any Code category and tap the <Bookmark size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on a card to save it here.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total important-total">{total}</span>
            <span className="nailed-screen-total-label">important program{total !== 1 ? 's' : ''} across {importantByTopic.length} categor{importantByTopic.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <WeakOnlyBar weakOnly={weakOnly} onChange={setWeakOnly} importantCount={impTotal} weakCount={weakTotal} />
          {total === 0 && <div className="nailed-screen-hint">এখনো কোনো Weak প্রশ্ন নেই</div>}
          <CategoryChipBar groups={importantByTopic} activeId={activeGroup?.topic.id} onSelect={setActiveId} />

          {activeGroup && (
            <div className="nailed-screen-list anim-fade" style={{ gap: 10 }}>
              {pageItems.map(({ q, qid }) => (
                <CodeImportantCard key={qid} q={q} qid={qid} topicColor={activeGroup.topic.color} onUnmark={weakOnly ? onUnweak : onUnmark} weakOnly={weakOnly} />
              ))}
              {totalPages > 1 && <Pagination page={curPage} totalPages={totalPages} onPageChange={setPage} />}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CodeImportantCard({ q, qid, topicColor, onUnmark, weakOnly }) {
  return (
    <div className="written-card open" style={{ '--c': topicColor }}>
      <div className="written-card-header">
        <div className="written-card-toggle" style={{ cursor: 'default' }}>
          <WrittenQuestionText uid={q._uid} text={q.q} className="written-qtext" style={{ paddingTop: 2 }} />
        </div>
        <WeakButton uid={qid} className="nailed-unnail-btn nailed-weak-btn" size={13} />
        <button
          className="nailed-unnail-btn"
          onClick={() => onUnmark(qid)}
          title={weakOnly ? 'Remove from Weak' : 'Remove from Important'}
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          <X size={13} />
        </button>
        <DeleteButton question={q} className="nailed-unnail-btn" iconOnly size={13} />
      </div>
      <WrittenCardBody a={q.answer} question={q.q} topicColor={topicColor} uid={q._uid} />
    </div>
  )
}
