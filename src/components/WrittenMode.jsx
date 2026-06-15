import { Bookmark, BookOpenText, ChevronDown, ChevronLeft, ChevronUp, Home, LayoutGrid, PenLine, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useWrittenMasteredContext } from '../contexts/WrittenMasteredContext.jsx'
import { WRITTEN_TOPICS, getWrittenData } from '../data/written/index.js'
import { focusScroll } from '../lib/focusScroll.js'
import CategorySidebar from './CategorySidebar.jsx'
import { WrittenCardBody } from './WrittenCardBody.jsx'

export default function WrittenMode() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const backTo = location.state?.backTo  // set when arriving from search — return there
  const { value: important, add: onMarkImportant, remove: onUnmarkImportant } = useImportantContext()
  const { value: writtenMastered, add: onNailWritten, remove: onUnnailWritten } = useWrittenMasteredContext()

  const topicId = searchParams.get('topic') || WRITTEN_TOPICS[0]?.id
  const topic = WRITTEN_TOPICS.find(t => t.id === topicId) || WRITTEN_TOPICS[0]
  const writtenData = topic ? getWrittenData(topic.id) : { questions: [] }

  const questions = writtenData?.questions || []
  const [openIds, setOpenIds] = useState({})
  const [filterImportant, setFilterImportant] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const qid = (q) => `written__${topic.id}__${q.id}`
  const toggleImportant = (q) => {
    const id = qid(q)
    important.has(id) ? onUnmarkImportant(id) : onMarkImportant(id)
  }
  const toggleNailed = (q) => {
    const id = qid(q)
    writtenMastered.has(id) ? onUnnailWritten(id) : onNailWritten(id)
  }

  const toggleCard = (id) => setOpenIds(prev => ({ ...prev, [id]: !prev[id] }))

  const nonNailed       = questions.filter(q => !writtenMastered?.has(qid(q)))
  const importantCount  = nonNailed.filter(q => important?.has(qid(q))).length
  const visibleQuestions = filterImportant
    ? nonNailed.filter(q => important?.has(qid(q)))
    : nonNailed

  // Deep-link: ?q=<questionId> opens and scrolls to a specific written answer.
  const focusQ = searchParams.get('q')
  useEffect(() => {
    if (!focusQ) return
    setOpenIds(prev => prev[focusQ] ? prev : { ...prev, [focusQ]: true })
    return focusScroll(() => document.getElementById('written-q-' + focusQ))
  }, [focusQ, topicId])

  if (!topic) return null

  return (
    <div className="written-page anim-fade">
      <div className="written-topbar">
        <button className="back-btn" onClick={() => backTo ? navigate(backTo) : navigate('/', { state: { module: 'written' } })}>
          <ChevronLeft size={15} /> {backTo ? 'Back' : 'All Categories'}
        </button>
        <div className="written-topic-pill" style={{ color: topic.color, borderColor: `${topic.color}55` }}>
          <PenLine size={13} />
          {topic.shortName} — Written Q&A
        </div>
        <div className="topbar-right-actions">
          <button className="cat-browse-btn" onClick={() => setSidebarOpen(true)} title="Browse categories">
            <LayoutGrid size={16} />
          </button>
          <button className="study-home-btn" onClick={() => navigate('/')} title="Home">
            <Home size={16} />
          </button>
        </div>
      </div>

      <CategorySidebar
        topics={WRITTEN_TOPICS}
        currentTopicId={topic.id}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(t) => navigate('/written?topic=' + t.id)}
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

      {visibleQuestions.length === 0 ? (
        <div className="written-empty">
          <BookOpenText size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p>
            {filterImportant
              ? 'কোনো Important প্রশ্ন নেই।'
              : questions.length > 0 ? 'সব প্রশ্ন nailed! 🎉' : 'এই topic-এ এখনো কোনো written প্রশ্ন নেই।'}
          </p>
        </div>
      ) : (
        <>
          <p className="section-label" style={{ marginBottom: 16 }}>
            {visibleQuestions.length} টি প্রশ্ন
          </p>
          <div className="written-list">
            {visibleQuestions.map((q, idx) => (
              <WrittenCard
                key={q.id}
                domId={'written-q-' + q.id}
                q={q}
                idx={idx}
                topicColor={topic.color}
                isOpen={!!openIds[q.id]}
                isImportant={important?.has(qid(q))}
                isNailed={writtenMastered?.has(qid(q))}
                onToggle={() => toggleCard(q.id)}
                onToggleImportant={() => toggleImportant(q)}
                onToggleNailed={() => toggleNailed(q)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function WrittenCard({ domId, q, idx, topicColor, isOpen, isImportant, isNailed, onToggle, onToggleImportant, onToggleNailed }) {
  const a = q.answer

  return (
    <div id={domId} className={`written-card${isOpen ? ' open' : ''}`} style={{ '--c': topicColor }}>

      <div className="written-card-header" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <div className="written-card-toggle">
          <span className="written-qnum" style={{ color: topicColor }}>Q{idx + 1}</span>
          <span className="written-qtext">{q.q}</span>
          <span className="written-chevron">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
        <button
          className={`written-imp-btn${isNailed ? ' nailed' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleNailed() }}
          title={isNailed ? 'Un-nail' : 'Nail It — mark as mastered'}
        >
          <Star size={14} fill={isNailed ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`written-imp-btn${isImportant ? ' marked' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleImportant() }}
          title={isImportant ? 'Remove from Important' : 'Mark as Important'}
        >
          <Bookmark size={14} fill={isImportant ? 'currentColor' : 'none'} />
        </button>
      </div>

      {isOpen && (
        <div className="anim-slide">
          <WrittenCardBody a={a} topicColor={topicColor} />
        </div>
      )}
    </div>
  )
}
