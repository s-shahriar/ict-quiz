import { useState } from 'react' // needed for nailedOpen
import { Zap, Brain, PenLine, Star, ChevronDown, ChevronUp, X } from 'lucide-react'

export default function HomeScreen({ topics, writtenTopics, onSelectMCQ, onSelectWritten, onExam, mastered, onUnnail, activeModule, onModuleChange }) {
  const module    = activeModule
  const setModule = onModuleChange
  const [nailedOpen, setNailedOpen] = useState(false)

  // Build nailed questions grouped by topic for the panel
  const nailedByTopic = topics.map(t => {
    const qs = t.questions
      .map((q, i) => ({ q, qid: `${t.id}__${i}` }))
      .filter(({ q }) => q.options && q.correct_answer)
      .filter(({ qid }) => mastered.has(qid))
    return { topic: t, items: qs }
  }).filter(g => g.items.length > 0)

  const totalNailed = nailedByTopic.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="home anim-fade">
      <header className="home-header">
        <div className="logo-row">
          <div className="logo-icon-wrap"><Zap size={22} /></div>
          <span className="logo-title">ICT Quiz</span>
        </div>
        <p className="home-sub">Master Information &amp; Communication Technology</p>

        <div className="module-toggle">
          <button className={`module-btn${module === 'mcq' ? ' active' : ''}`} onClick={() => setModule('mcq')}>
            <Brain size={15} /> MCQ Module
          </button>
          <button className={`module-btn${module === 'written' ? ' active' : ''}`} onClick={() => setModule('written')}>
            <PenLine size={15} /> Written Module
          </button>
        </div>
      </header>

      {module === 'mcq' ? (
        <>
          {/* Exam Mode card */}
          <button className="exam-mode-card" onClick={onExam}>
            <div className="emc-glow" aria-hidden="true" />
            <div className="emc-icon-wrap">
              <Zap size={22} className="emc-icon" />
            </div>
            <div className="emc-body">
              <div className="emc-title">Exam Mode</div>
            </div>
            <div className="emc-cta">
              Start Exam
              <span className="emc-arrow">→</span>
            </div>
          </button>

          <p className="section-label">Choose a Topic</p>
          <main className="topics-grid">
            {topics.map(t => <TopicCard key={t.id} topic={t} onClick={() => onSelectMCQ(t)} />)}
          </main>

          {/* Nailed It panel */}
          {totalNailed > 0 && (
            <div className="nailed-panel">
              <button className="nailed-panel-header" onClick={() => setNailedOpen(v => !v)}>
                <div className="nailed-panel-title">
                  <Star size={15} fill="currentColor" style={{ color: '#f59e0b' }} />
                  Nailed It
                  <span className="nailed-count-badge">{totalNailed}</span>
                </div>
                {nailedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {nailedOpen && (
                <div className="nailed-panel-body anim-slide">
                  {nailedByTopic.map(({ topic: t, items }) => (
                    <div key={t.id} className="nailed-topic-group">
                      <div className="nailed-topic-label" style={{ color: t.color }}>
                        <span className="nailed-topic-dot" style={{ background: t.color }} />
                        {t.name}
                      </div>
                      {items.map(({ q, qid }) => (
                        <div key={qid} className="nailed-item">
                          <span className="nailed-item-text">{q.question}</span>
                          <button
                            className="nailed-unnail-btn"
                            onClick={() => onUnnail(qid)}
                            title="Remove from Nailed It"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="section-label">Choose a Category</p>
          <main className="topics-grid">
            {writtenTopics.map(t => (
              <WrittenCategoryCard key={t.id} topic={t} onClick={() => onSelectWritten(t)} />
            ))}
          </main>
        </>
      )}
    </div>
  )
}

function TopicCard({ topic, onClick }) {
  const Icon = topic.icon
  return (
    <button className="topic-card" onClick={onClick} style={{ '--c': topic.color }}>
      <div className="tc-icon"><Icon size={20} /></div>
      <div className="tc-body">
        <span className="tc-name">{topic.name}</span>
        <span className="tc-count">{topic.questions.length} questions</span>
      </div>
      <span className="tc-arrow">›</span>
    </button>
  )
}

function WrittenCategoryCard({ topic, onClick }) {
  const Icon = topic.icon
  return (
    <button className="topic-card written-category-card" onClick={onClick} style={{ '--c': topic.color }}>
      <div className="tc-icon"><Icon size={20} /></div>
      <div className="tc-body">
        <span className="tc-name">{topic.name}</span>
        <span className="tc-count">{topic.writtenCount} written answers</span>
      </div>
      <span className="tc-badge" style={{ background: `${topic.color}20`, color: topic.color }}>
        <PenLine size={11} />
        {topic.writtenCount}
      </span>
    </button>
  )
}
