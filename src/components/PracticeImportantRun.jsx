import { Bookmark, ChevronLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { PRACTICE_CATEGORIES, buildCommandList, getPracticeData, practiceCmdId } from '../data/practice/index.js'
import { CommandPractice } from './PracticeMode.jsx'

// Runs a single drill session over every important practice item across all
// categories/topics. Each drill carries its own category/topic so importance
// ids and case-insensitivity resolve correctly in the shared CommandPractice.
export default function PracticeImportantRun() {
  const navigate = useNavigate()
  const { value: important, toggle: toggleImportant } = useImportantContext()

  const drills = []
  for (const cat of PRACTICE_CATEGORIES) {
    const data = getPracticeData(cat.id)
    if (!data) continue
    for (const topic of data.topics || []) {
      const seen = new Set()
      const meta = { _ci: cat.id === 'sql', _topicName: topic.name, _catName: cat.name }
      // Real drills marked important.
      for (const p of topic.practice || []) {
        const cmd = p.accept?.[0]
        if (!cmd) continue
        const id = practiceCmdId(cat.id, topic.id, cmd)
        if (important.has(id)) { seen.add(id); drills.push({ ...p, _impId: id, ...meta }) }
      }
      // Reference-only commands marked important (no drill behind them) — turn
      // each into a drill: prompt = its description, answer = the command.
      for (const c of buildCommandList(topic.commands, topic.practice)) {
        const id = practiceCmdId(cat.id, topic.id, c.cmd)
        if (important.has(id) && !seen.has(id)) {
          seen.add(id)
          drills.push({ prompt: c.desc || 'এই command টি লেখো', accept: [c.cmd], _impId: id, ...meta })
        }
      }
    }
  }

  return (
    <div className="practice-page anim-fade">
      <div className="written-topbar practice-topbar">
        <button className="back-btn" onClick={() => navigate('/practice/important')}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="written-topic-pill practice-pill">
          <Bookmark size={13} fill="currentColor" /> Important Practice
        </div>
        <div className="topbar-right-actions">
          <button className="study-home-btn" onClick={() => navigate('/', { state: { module: 'practice' } })} title="Home">
            <Home size={16} />
          </button>
        </div>
      </div>

      <div className="practice-content">
        {drills.length === 0 ? (
          <div className="practice-placeholder">
            <Bookmark size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
            <p>কোনো important practice নেই — Practice বা Commands tab-এ 🔖 দিয়ে যোগ করো।</p>
          </div>
        ) : (
          <CommandPractice
            problems={drills}
            important={important}
            onToggleImportant={toggleImportant}
            idOf={p => p._impId}
            ciOf={p => p._ci}
            showFilter={false}
            showTopicTag
          />
        )}
      </div>
    </div>
  )
}
