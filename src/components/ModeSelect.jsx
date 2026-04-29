import { ChevronLeft, Brain, BookOpen } from 'lucide-react'

export default function ModeSelect({ topic, onQuiz, onStudy, onBack }) {
  const Icon = topic.icon
  return (
    <div className="mode-page anim-fade">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={15} /> All Topics
      </button>

      <div className="mode-topic-hero">
        <div
          className="mode-icon-circle"
          style={{ background: `${topic.color}18`, color: topic.color }}
        >
          <Icon size={34} />
        </div>
        <div className="mode-topic-name" style={{ color: topic.color }}>
          {topic.name}
        </div>
        <div className="mode-topic-meta">{topic.questions.length} questions available</div>
      </div>

      <div className="mode-cards">
        <button className="mode-card" onClick={onQuiz}>
          <Brain size={32} style={{ color: topic.color }} />
          <h3>Quiz Mode</h3>
          <p>Answer questions one by one. Get instant right/wrong feedback and track your score.</p>
          <span className="mode-card-cta" style={{ color: topic.color }}>Start Quiz →</span>
        </button>

        <button className="mode-card" onClick={onStudy}>
          <BookOpen size={32} style={{ color: topic.color }} />
          <h3>Study Mode</h3>
          <p>Browse all Q&amp;As at your own pace. Reveal answers when ready. Great for revision.</p>
          <span className="mode-card-cta" style={{ color: topic.color }}>Start Reading →</span>
        </button>
      </div>
    </div>
  )
}
