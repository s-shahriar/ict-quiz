import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, Brain, PenLine, Star, Bookmark, ShieldCheck, Dumbbell } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { WRITTEN_TOPICS } from '../data/written/index.js'
import { PRACTICE_CATEGORIES } from '../data/practice/index.js'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useWrittenMasteredContext } from '../contexts/WrittenMasteredContext.jsx'

export default function HomeScreen({ onBackup }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { value: mastered } = useMasteredContext()
  const { value: important } = useImportantContext()
  const { value: writtenMastered } = useWrittenMasteredContext()

  const initialModule = location.state?.module
  const [module, setModule] = useState(
    initialModule === 'written' || initialModule === 'practice' ? initialModule : 'mcq'
  )

  const topics = TOPICS
  const writtenTopics = WRITTEN_TOPICS

  const totalNailed = topics.reduce((s, t) =>
    s + t.questions.filter((q, i) => q.options && q.correct_answer && mastered.has(`${t.id}__${i}`)).length
  , 0)

  const totalImportant = topics.reduce((s, t) =>
    s + t.questions.filter((q, i) => q.options && q.correct_answer && important.has(`${t.id}__${i}`)).length
  , 0)

  const totalWrittenImportant = (writtenTopics || []).reduce((s, t) =>
    s + [...important].filter(id => id.startsWith(`written__${t.id}__`)).length
  , 0)

  const totalWrittenNailed = writtenMastered?.size ?? 0

  const totalPracticeImportant = [...important].filter(id => id.startsWith('practice__')).length

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
          <button className={`module-btn${module === 'practice' ? ' active' : ''}`} onClick={() => setModule('practice')}>
            <Dumbbell size={15} /> Practice
          </button>
        </div>
      </header>

      {module === 'mcq' && (
        <>
          <div className="home-action-row home-action-row--3">
            <button className="action-card exam-card" onClick={() => navigate('/exam')}>
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

            <button className="action-card nailed-card" onClick={() => navigate('/nailed')}>
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

            <button className="action-card important-card" onClick={() => navigate('/important')}>
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

          <div className="backup-trigger-row">
            <button className="backup-trigger-btn" onClick={onBackup}>
              <ShieldCheck size={13} /> Backup & Restore
            </button>
          </div>

          <p className="section-label">Choose a Topic</p>
          <main className="topics-grid">
            {topics.map(t => <TopicCard key={t.id} topic={t} onClick={() => navigate('/mcq/' + t.id)} />)}
          </main>
        </>
      )}

      {module === 'written' && (
        <>
          <div className="home-action-row">
            <button className="action-card nailed-card" onClick={() => navigate('/written/nailed')}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--nailed">
                <Star size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Nailed It</div>
                <div className="ac-sub">{totalWrittenNailed} saved</div>
              </div>
              <div className="ac-footer ac-footer--nailed">
                View <span className="ac-arrow">→</span>
              </div>
            </button>

            <button className="action-card important-card" onClick={() => navigate('/written/important')}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--important">
                <Bookmark size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Important</div>
                <div className="ac-sub">{totalWrittenImportant} saved</div>
              </div>
              <div className="ac-footer ac-footer--important">
                View <span className="ac-arrow">→</span>
              </div>
            </button>
          </div>

          <p className="section-label">Choose a Category</p>
          <main className="topics-grid">
            {writtenTopics.map(t => (
              <WrittenCategoryCard key={t.id} topic={t} onClick={() => navigate('/written?topic=' + t.id)} />
            ))}
          </main>
        </>
      )}

      {module === 'practice' && (
        <>
          <div className="home-action-row">
            <button className="action-card important-card" onClick={() => navigate('/practice/important')}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--important">
                <Bookmark size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Important</div>
                <div className="ac-sub">{totalPracticeImportant} saved</div>
              </div>
              <div className="ac-footer ac-footer--important">
                View <span className="ac-arrow">→</span>
              </div>
            </button>
          </div>

          <p className="section-label">Choose a Category</p>
          <main className="topics-grid">
            {PRACTICE_CATEGORIES.map(c => (
              <PracticeCategoryCard key={c.id} category={c} onClick={() => navigate('/practice?category=' + c.id)} />
            ))}
          </main>
        </>
      )}
    </div>
  )
}

function TopicCard({ topic, onClick }) {
  const Icon = topic.icon
  const validCount = topic.questions.filter(q => q.options && q.correct_answer).length
  return (
    <button className="topic-card" onClick={onClick} style={{ '--c': topic.color }}>
      <div className="tc-icon"><Icon size={20} /></div>
      <div className="tc-body">
        <span className="tc-name">{topic.name}</span>
        <span className="tc-count">{validCount} questions</span>
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

function PracticeCategoryCard({ category, onClick }) {
  const Icon = category.icon
  return (
    <button className="topic-card written-category-card" onClick={onClick} style={{ '--c': category.color }}>
      <div className="tc-icon"><Icon size={20} /></div>
      <div className="tc-body">
        <span className="tc-name">{category.name}</span>
        <span className="tc-count">{category.topicCount} topics</span>
      </div>
      <span className="tc-badge" style={{ background: `${category.color}20`, color: category.color }}>
        <Dumbbell size={11} />
        {category.topicCount}
      </span>
    </button>
  )
}
