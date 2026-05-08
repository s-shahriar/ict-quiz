import { useState } from 'react'
import { Zap, Brain, PenLine } from 'lucide-react'

export default function HomeScreen({ topics, writtenTopics, onSelectMCQ, onSelectWritten }) {
  const [module, setModule] = useState('mcq')

  return (
    <div className="home anim-fade">
      <header className="home-header">
        <div className="logo-row">
          <div className="logo-icon-wrap">
            <Zap size={22} />
          </div>
          <span className="logo-title">ICT Quiz</span>
        </div>
        <p className="home-sub">Master Information &amp; Communication Technology</p>

        {/* Module toggle */}
        <div className="module-toggle">
          <button
            className={`module-btn${module === 'mcq' ? ' active' : ''}`}
            onClick={() => setModule('mcq')}
          >
            <Brain size={15} />
            MCQ Module
          </button>
          <button
            className={`module-btn${module === 'written' ? ' active' : ''}`}
            onClick={() => setModule('written')}
          >
            <PenLine size={15} />
            Written Module
          </button>
        </div>

      </header>

      {module === 'mcq' ? (
        <>
          <p className="section-label">Choose a Topic</p>
          <main className="topics-grid">
            {topics.map(t => (
              <TopicCard key={t.id} topic={t} onClick={() => onSelectMCQ(t)} />
            ))}
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
