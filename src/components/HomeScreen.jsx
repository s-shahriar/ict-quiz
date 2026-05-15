import { Zap, Brain, PenLine, Star, Bookmark } from 'lucide-react'

export default function HomeScreen({ topics, writtenTopics, onSelectMCQ, onSelectWritten, onExam, onNailed, onImportant, mastered, important, activeModule, onModuleChange }) {
  const module    = activeModule
  const setModule = onModuleChange

  const totalNailed = topics.reduce((s, t) =>
    s + t.questions.filter((q, i) => q.options && q.correct_answer && mastered.has(`${t.id}__${i}`)).length
  , 0)

  const totalImportant = topics.reduce((s, t) =>
    s + t.questions.filter((q, i) => q.options && q.correct_answer && important.has(`${t.id}__${i}`)).length
  , 0)

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
          {/* Action cards row */}
          <div className="home-action-row home-action-row--3">
            <button className="action-card exam-card" onClick={onExam}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--exam">
                <Zap size={22} className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Exam Mode</div>
                <div className="ac-sub">Test yourself</div>
              </div>
              <div className="ac-footer ac-footer--exam">
                Start <span className="ac-arrow">→</span>
              </div>
            </button>

            <button className="action-card nailed-card" onClick={onNailed}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--nailed">
                <Star size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Nailed It</div>
                <div className="ac-sub">{totalNailed} saved</div>
              </div>
              <div className="ac-footer ac-footer--nailed">
                View <span className="ac-arrow">→</span>
              </div>
            </button>

            <button className="action-card important-card" onClick={onImportant}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--important">
                <Bookmark size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Important</div>
                <div className="ac-sub">{totalImportant} saved</div>
              </div>
              <div className="ac-footer ac-footer--important">
                View <span className="ac-arrow">→</span>
              </div>
            </button>
          </div>

          <p className="section-label">Choose a Topic</p>
          <main className="topics-grid">
            {topics.map(t => <TopicCard key={t.id} topic={t} onClick={() => onSelectMCQ(t)} />)}
          </main>
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
