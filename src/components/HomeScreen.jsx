import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Zap, Brain, PenLine, Star, Bookmark, Dumbbell, Sparkles, Mic } from 'lucide-react'
import { TOPICS } from '../data/index.js'
import { WRITTEN_TOPICS, getWrittenData } from '../data/written/index.js'
import { EXTRA_TOPICS, getExtraData } from '../data/extra/index.js'
import { VIVA_TOPICS, getVivaData } from '../data/viva/index.js'
import { PRACTICE_CATEGORIES } from '../data/practice/index.js'
import { useAllContentReady } from '../data/contentLoader.js'
import { useMasteredContext } from '../contexts/MasteredContext.jsx'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import GroupSearch from './GroupSearch.jsx'
import WrittenSearch from './WrittenSearch.jsx'
import ExtraSearch from './ExtraSearch.jsx'
import VivaSearch from './VivaSearch.jsx'

export default function HomeScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { value: mastered } = useMasteredContext()
  const { value: important } = useImportantContext()

  const [searchParams] = useSearchParams()
  // Capture restore target once per mount (HomeScreen remounts on browser-back
  // from a study/written page, so this picks up that URL's params).
  const [restored] = useState(() => ({
    module: location.state?.module || searchParams.get('module') || '',
    search: searchParams.get('search') || '',
  }))
  const [module, setModule] = useState(
    ['written', 'practice', 'extra', 'viva'].includes(restored.module) ? restored.module : 'mcq'
  )
  const [mcqSearching, setMcqSearching] = useState(false)
  const [writtenSearching, setWrittenSearching] = useState(false)
  const [extraSearching, setExtraSearching] = useState(false)
  const [vivaSearching, setVivaSearching] = useState(false)

  const topics = TOPICS
  const writtenTopics = WRITTEN_TOPICS
  const extraTopics = EXTRA_TOPICS
  const vivaTopics = VIVA_TOPICS

  // Load every module so the per-module counts below are accurate. Counts are
  // scoped per module (by iterating that module's own items and matching q._uid)
  // — a flag in one module must never inflate another module's card.
  useAllContentReady()

  const countTopics = (list, set) =>
    (list || []).reduce((s, t) => s + t.questions.filter(q => q._uid && set.has(q._uid)).length, 0)
  const countData = (list, getData, set) =>
    (list || []).reduce((s, t) => s + (getData(t.id)?.questions || []).filter(q => q._uid && set.has(q._uid)).length, 0)

  const totalNailed        = countTopics(topics, mastered)
  const totalImportant     = countTopics(topics, important)
  const totalWrittenNailed    = countData(writtenTopics, getWrittenData, mastered)
  const totalWrittenImportant = countData(writtenTopics, getWrittenData, important)
  const totalExtraNailed      = countData(extraTopics, getExtraData, mastered)
  const totalExtraImportant   = countData(extraTopics, getExtraData, important)
  const totalVivaNailed       = countData(vivaTopics, getVivaData, mastered)
  const totalVivaImportant    = countData(vivaTopics, getVivaData, important)
  // Practice content is bundled; its important flags are keyed by command id.
  const totalPracticeImportant = [...important].filter(id => typeof id === 'string' && id.startsWith('practice')).length

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
          <button className={`module-btn${module === 'extra' ? ' active' : ''}`} onClick={() => setModule('extra')}>
            <Sparkles size={15} /> Extra
          </button>
          <button className={`module-btn${module === 'viva' ? ' active' : ''}`} onClick={() => setModule('viva')}>
            <Mic size={15} /> Viva
          </button>
        </div>
      </header>

      {module === 'mcq' && (
        <>
          <GroupSearch topics={topics} onActiveChange={setMcqSearching} initialQuery={restored.module === 'mcq' ? restored.search : ''} />
        </>
      )}

      {module === 'mcq' && !mcqSearching && (
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

          <p className="section-label">Choose a Topic</p>
          <main className="topics-grid">
            {topics.map(t => <TopicCard key={t.id} topic={t} onClick={() => navigate('/mcq/' + t.id)} />)}
          </main>
        </>
      )}

      {module === 'written' && (
        <>
          <WrittenSearch onActiveChange={setWrittenSearching} initialQuery={restored.module === 'written' ? restored.search : ''} />
        </>
      )}

      {module === 'written' && !writtenSearching && (
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

      {module === 'extra' && (
        <>
          <ExtraSearch onActiveChange={setExtraSearching} initialQuery={restored.module === 'extra' ? restored.search : ''} />
        </>
      )}

      {module === 'extra' && !extraSearching && (
        <>
          <div className="home-action-row">
            <button className="action-card nailed-card" onClick={() => navigate('/extra/nailed')}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--nailed">
                <Star size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Nailed It</div>
                <div className="ac-sub">{totalExtraNailed} saved</div>
              </div>
              <div className="ac-footer ac-footer--nailed">
                View <span className="ac-arrow">→</span>
              </div>
            </button>

            <button className="action-card important-card" onClick={() => navigate('/extra/important')}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--important">
                <Bookmark size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Important</div>
                <div className="ac-sub">{totalExtraImportant} saved</div>
              </div>
              <div className="ac-footer ac-footer--important">
                View <span className="ac-arrow">→</span>
              </div>
            </button>
          </div>

          <p className="section-label">Choose a Category</p>
          <main className="topics-grid">
            {extraTopics.map(t => (
              <ExtraCategoryCard key={t.id} topic={t} onClick={() => navigate('/extra?topic=' + t.id)} />
            ))}
          </main>
        </>
      )}

      {module === 'viva' && (
        <>
          <VivaSearch onActiveChange={setVivaSearching} initialQuery={restored.module === 'viva' ? restored.search : ''} />
        </>
      )}

      {module === 'viva' && !vivaSearching && (
        <>
          <div className="home-action-row">
            <button className="action-card nailed-card" onClick={() => navigate('/viva/nailed')}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--nailed">
                <Star size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Nailed It</div>
                <div className="ac-sub">{totalVivaNailed} saved</div>
              </div>
              <div className="ac-footer ac-footer--nailed">
                View <span className="ac-arrow">→</span>
              </div>
            </button>

            <button className="action-card important-card" onClick={() => navigate('/viva/important')}>
              <div className="ac-shine" aria-hidden="true" />
              <div className="ac-icon-wrap ac-icon-wrap--important">
                <Bookmark size={20} fill="currentColor" className="ac-icon" />
              </div>
              <div className="ac-body">
                <div className="ac-label">Important</div>
                <div className="ac-sub">{totalVivaImportant} saved</div>
              </div>
              <div className="ac-footer ac-footer--important">
                View <span className="ac-arrow">→</span>
              </div>
            </button>
          </div>

          <p className="section-label">Choose a Category</p>
          {vivaTopics.length === 0 ? (
            <div className="written-empty">
              <Mic size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
              <p>এখনো কোনো Viva প্রশ্ন যোগ করা হয়নি।</p>
            </div>
          ) : (
            <main className="topics-grid">
              {vivaTopics.map(t => (
                <VivaCategoryCard key={t.id} topic={t} onClick={() => navigate('/viva?topic=' + t.id)} />
              ))}
            </main>
          )}
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

function ExtraCategoryCard({ topic, onClick }) {
  const Icon = topic.icon
  return (
    <button className="topic-card written-category-card" onClick={onClick} style={{ '--c': topic.color }}>
      <div className="tc-icon"><Icon size={20} /></div>
      <div className="tc-body">
        <span className="tc-name">{topic.name}</span>
        <span className="tc-count">{topic.extraCount} scenario answers</span>
      </div>
      <span className="tc-badge" style={{ background: `${topic.color}20`, color: topic.color }}>
        <Sparkles size={11} />
        {topic.extraCount}
      </span>
    </button>
  )
}

function VivaCategoryCard({ topic, onClick }) {
  const Icon = topic.icon
  return (
    <button className="topic-card written-category-card" onClick={onClick} style={{ '--c': topic.color }}>
      <div className="tc-icon"><Icon size={20} /></div>
      <div className="tc-body">
        <span className="tc-name">{topic.name}</span>
        <span className="tc-count">{topic.vivaCount} viva answers</span>
      </div>
      <span className="tc-badge" style={{ background: `${topic.color}20`, color: topic.color }}>
        <Mic size={11} />
        {topic.vivaCount}
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
