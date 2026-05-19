import { useState } from 'react'
import { ChevronLeft, Home, ChevronDown, ChevronUp, BookOpenText, PenLine, Bookmark, Star } from 'lucide-react'
import { WrittenCardBody } from './WrittenCardBody.jsx'

export default function WrittenMode({ topic, writtenData, important, writtenMastered, onMarkImportant, onUnmarkImportant, onNailWritten, onUnnailWritten, onBack, onHome }) {
  const questions = writtenData?.questions || []
  const [openIds, setOpenIds] = useState(() => new Set(questions.map(q => q.id)))
  const [filterImportant, setFilterImportant] = useState(false)

  const qid = (q) => `written__${topic.id}__${q.id}`
  const toggleImportant = (q) => {
    const id = qid(q)
    important.has(id) ? onUnmarkImportant(id) : onMarkImportant(id)
  }
  const toggleNailed = (q) => {
    const id = qid(q)
    writtenMastered.has(id) ? onUnnailWritten(id) : onNailWritten(id)
  }

  const toggleCard = (id) => setOpenIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const nonNailed       = questions.filter(q => !writtenMastered?.has(qid(q)))
  const importantCount  = nonNailed.filter(q => important?.has(qid(q))).length
  const visibleQuestions = filterImportant
    ? nonNailed.filter(q => important?.has(qid(q)))
    : nonNailed

  return (
    <div className="written-page anim-fade">
      <div className="written-topbar">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={15} /> All Categories
        </button>
        <div className="written-topic-pill" style={{ color: topic.color, borderColor: `${topic.color}55` }}>
          <PenLine size={13} />
          {topic.shortName} — Written Q&amp;A
        </div>
        <button className="study-home-btn" onClick={onHome} title="Home">
          <Home size={16} />
        </button>
      </div>

      {/* Filter bar */}
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
                q={q}
                idx={idx}
                topicColor={topic.color}
                isOpen={openIds.has(q.id)}
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

function WrittenCard({ q, idx, topicColor, isOpen, isImportant, isNailed, onToggle, onToggleImportant, onToggleNailed }) {
  const a = q.answer

  return (
    <div className={`written-card${isOpen ? ' open' : ''}`} style={{ '--c': topicColor }}>

      {/* ── Header ── */}
      <div className="written-card-header">
        <button className="written-card-toggle" onClick={onToggle}>
          <span className="written-qnum" style={{ color: topicColor }}>Q{idx + 1}</span>
          <span className="written-qtext">{q.q}</span>
          <span className="written-chevron">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
        <button
          className={`written-imp-btn${isNailed ? ' nailed' : ''}`}
          onClick={onToggleNailed}
          title={isNailed ? 'Un-nail' : 'Nail It — mark as mastered'}
        >
          <Star size={14} fill={isNailed ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`written-imp-btn${isImportant ? ' marked' : ''}`}
          onClick={onToggleImportant}
          title={isImportant ? 'Remove from Important' : 'Mark as Important'}
        >
          <Bookmark size={14} fill={isImportant ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── Body ── */}
      {isOpen && (
        <div className="anim-slide">
          <WrittenCardBody a={a} topicColor={topicColor} />
        </div>
      )}
    </div>
  )
}
