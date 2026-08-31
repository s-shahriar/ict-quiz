import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate, useSearchParams, useLocation } from 'react-router-dom'
import { ChevronLeft, Star, Bookmark, LayoutGrid } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useModuleReady } from '../data/contentLoader.js'
import { focusScroll } from '../lib/focusScroll.js'
import CategorySidebar from './CategorySidebar.jsx'
import StudyCard from './shared/StudyCard.jsx'
import { useTrash } from '../contexts/TrashContext.jsx'
import TopbarActions from './shared/TopbarActions.jsx'

export default function StudyMode() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = location.state?.backTo  // set when arriving from search — return there
  const topic = TOPICS.find(t => t.id === topicId)
  const ready = useModuleReady('mcq')
  const { value: mastered, add: onNail } = useMasteredContext()
  const { value: important, add: onMarkImportant, remove: onUnmarkImportant } = useImportantContext()
  const { trashedIds } = useTrash()

  const [filterImportant, setFilterImportant] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Deep-link: ?q=<uid> scrolls to and pulses a specific question.
  const [searchParams] = useSearchParams()
  const focusUid = searchParams.get('q')
  useEffect(() => {
    if (!focusUid) return
    return focusScroll(() => document.getElementById('study-q-' + focusUid))
  }, [focusUid])

  if (!topic) return <Navigate to="/" replace />
  if (!ready) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-3)', fontSize: '0.85rem' }}>Loading…</div>

  const allQ = topic.questions
    .map((q) => ({ q, qid: q._uid }))
    .filter(({ q }) => q.options && q.correct_answer && !trashedIds.has(q._id))

  const nonNailed = allQ.filter(({ qid }) => !mastered.has(qid))
  const nailedCt  = allQ.length - nonNailed.length

  const importantCount = nonNailed.filter(({ qid }) => important?.has(qid)).length

  const visible = filterImportant
    ? nonNailed.filter(({ qid }) => important?.has(qid))
    : nonNailed

  return (
    <div className="study-page anim-fade">
      <div className="study-topbar">
        <button className="back-btn" onClick={() => navigate(backTo || '/mcq/' + topic.id)}>
          <ChevronLeft size={15} /> Back
        </button>
        <span className="study-title" style={{ color: topic.color }}>{topic.name}</span>
        <TopbarActions>
          <button className="cat-browse-btn" onClick={() => setSidebarOpen(true)} title="Browse categories">
            <LayoutGrid size={16} />
          </button>
        </TopbarActions>
      </div>

      <CategorySidebar
        topics={TOPICS}
        currentTopicId={topic.id}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(t) => navigate('/mcq/' + t.id + '/study')}
      />

      <div className="study-filter-bar">
        <button
          className={`study-filter-btn${!filterImportant ? ' active' : ''}`}
          onClick={() => setFilterImportant(false)}
          style={!filterImportant ? { borderColor: topic.color, color: topic.color, background: `${topic.color}15` } : {}}
        >
          সব ({nonNailed.length})
        </button>
        <button
          className={`study-filter-btn${filterImportant ? ' active' : ''}`}
          onClick={() => setFilterImportant(true)}
          style={filterImportant ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' } : {}}
        >
          <Bookmark size={11} fill={filterImportant ? 'currentColor' : 'none'} />
          Important ({importantCount})
        </button>
      </div>

      {nailedCt > 0 && !filterImportant && (
        <div className="nailed-notice" style={{ borderColor: `${topic.color}40`, color: topic.color }}>
          <Star size={13} fill="currentColor" />
          <span>{nailedCt} টি question Nailed — <button onClick={() => navigate('/nailed')} className="nailed-notice-link">Nailed It</button> এ দেখো</span>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="study-all-nailed">
          {filterImportant
            ? <Bookmark size={38} style={{ color: '#ef4444', opacity: 0.4, marginBottom: 12 }} fill="currentColor" />
            : <Star size={38} style={{ color: topic.color, opacity: 0.5, marginBottom: 12 }} fill="currentColor" />
          }
          <p>{filterImportant ? 'কোনো Important প্রশ্ন নেই।' : 'সব প্রশ্ন Nailed করা হয়েছে! 🎉'}</p>
          <button className="back-btn" style={{ marginTop: 16 }} onClick={() => navigate('/')}>হোমে ফিরে যাও</button>
        </div>
      ) : (
        <div className="study-list">
          {visible.map(({ q, qid }, i) => (
            <StudyCard
              key={qid}
              domId={'study-q-' + qid}
              question={q}
              index={i}
              color={topic.color}
              nailed={mastered.has(qid)}
              isImportant={important?.has(qid)}
              onNail={() => onNail(qid)}
              onMarkImportant={() => onMarkImportant(qid)}
              onUnmarkImportant={() => onUnmarkImportant(qid)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
