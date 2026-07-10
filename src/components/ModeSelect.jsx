import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ChevronLeft, Brain, BookOpen } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { useModuleReady } from '../data/contentLoader.js'

export default function ModeSelect() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const topic = TOPICS.find(t => t.id === topicId)
  const ready = useModuleReady('mcq')

  if (!topic) return <Navigate to="/" replace />

  const Icon = topic.icon
  return (
    <div className="mode-page anim-fade">
      <button className="back-btn" onClick={() => navigate('/')}>
        <ChevronLeft size={15} /> All Topics
      </button>

      <div className="mode-topic-hero">
        <div
          className="mode-icon-circle"
          style={{
            background: `${topic.color}1a`,
            color: topic.color,
            boxShadow: `0 8px 40px ${topic.color}30, 0 0 0 1px ${topic.color}20`,
          }}
        >
          <Icon size={38} />
        </div>
        <div className="mode-topic-name" style={{ color: topic.color }}>
          {topic.name}
        </div>
        <div className="mode-topic-meta">{ready ? `${topic.questions.length} questions available` : 'Loading…'}</div>
      </div>

      <div className="mode-cards">
        <button className="mode-card" onClick={() => navigate('quiz')}>
          <div className="mode-card-icon" style={{ background: `${topic.color}1a`, color: topic.color }}>
            <Brain size={26} />
          </div>
          <h3>Quiz Mode</h3>
          <p>Answer questions one by one. Get instant right/wrong feedback and track your score.</p>
          <span className="mode-card-cta" style={{ color: topic.color }}>Start Quiz →</span>
        </button>

        <button className="mode-card" onClick={() => navigate('study')}>
          <div className="mode-card-icon" style={{ background: `${topic.color}1a`, color: topic.color }}>
            <BookOpen size={26} />
          </div>
          <h3>Study Mode</h3>
          <p>Browse all Q&amp;A at your own pace. Reveal answers when ready. Great for revision.</p>
          <span className="mode-card-cta" style={{ color: topic.color }}>Start Reading →</span>
        </button>
      </div>
    </div>
  )
}
