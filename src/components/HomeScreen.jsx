import { Zap } from 'lucide-react'

export default function HomeScreen({ topics, onSelect }) {
  const totalQ = topics.reduce((s, t) => s + t.questions.length, 0)

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
        <div className="home-stats-row">
          <div className="stat-badge"><strong>{topics.length}</strong>&nbsp;topics</div>
          <div className="stat-badge"><strong>{totalQ}</strong>&nbsp;questions</div>
        </div>
      </header>

      <p className="section-label">Choose a Topic</p>
      <main className="topics-grid">
        {topics.map(t => <TopicCard key={t.id} topic={t} onClick={() => onSelect(t)} />)}
      </main>
    </div>
  )
}

function TopicCard({ topic, onClick }) {
  const Icon = topic.icon
  return (
    <button
      className="topic-card"
      onClick={onClick}
      style={{ '--c': topic.color }}
    >
      <div className="tc-icon"><Icon size={20} /></div>
      <div className="tc-body">
        <span className="tc-name">{topic.name}</span>
        <span className="tc-count">{topic.questions.length} questions</span>
      </div>
      <span className="tc-arrow">›</span>
    </button>
  )
}
