import { Bookmark, ChevronDown, ChevronLeft, Dumbbell, Home, Terminal, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { PRACTICE_CATEGORIES, buildCommandList, getPracticeData, practiceCmdId } from '../data/practice/index.js'

export default function PracticeImportantScreen() {
  const navigate = useNavigate()
  const { value: important, remove: onUnmark } = useImportantContext()

  const groups = PRACTICE_CATEGORIES.map(cat => {
    const data = getPracticeData(cat.id)
    if (!data) return null
    const items = []
    for (const topic of data.topics || []) {
      const seen = new Set()
      // Drills first (keyed by their primary command); a command card sharing
      // that id is the same mark, so skip it to avoid listing it twice.
      ;(topic.practice || []).forEach(p => {
        const id = practiceCmdId(cat.id, topic.id, p.accept?.[0] || '')
        if (p.accept?.[0] && important.has(id) && !seen.has(id)) {
          seen.add(id)
          items.push({ kind: 'drill', id, topic, prompt: p.prompt, answer: p.accept[0], desc: p.explain })
        }
      })
      buildCommandList(topic.commands, topic.practice).forEach(c => {
        const id = practiceCmdId(cat.id, topic.id, c.key)
        if (important.has(id) && !seen.has(id)) {
          seen.add(id)
          items.push({ kind: 'cmd', id, topic, cmd: c.cmds[0], desc: c.desc })
        }
      })
    }
    return { cat, items }
  }).filter(g => g && g.items.length > 0)

  const total = groups.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="nailed-screen nailed-screen--wide anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'practice' } })}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Bookmark size={16} fill="currentColor" style={{ color: '#ef4444' }} />
          Important — Practice
        </div>
        <button className="study-home-btn" onClick={() => navigate('/', { state: { module: 'practice' } })} title="Home">
          <Home size={16} />
        </button>
      </div>

      {total === 0 ? (
        <div className="nailed-screen-empty">
          <Bookmark size={48} style={{ color: '#ef4444', opacity: 0.3 }} />
          <p>No important practice items yet.</p>
          <span>Open any Practice category and tap the <Bookmark size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on a drill or command to save it here.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total important-total">{total}</span>
            <span className="nailed-screen-total-label">important practice item{total !== 1 ? 's' : ''} across {groups.length} categor{groups.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <button className="practice-runall-btn" onClick={() => navigate('/practice/important/run')}>
            <Dumbbell size={16} /> সব Important practice করো ({total})
          </button>
          <div className="nailed-screen-list">
            {groups.map(({ cat, items }) => (
              <PracticeImportantGroup key={cat.id} cat={cat} items={items} onUnmark={onUnmark} onOpen={navigate} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PracticeImportantGroup({ cat, items, onUnmark, onOpen }) {
  const [open, setOpen] = useState(true)
  const Icon = cat.icon || Terminal
  return (
    <div className="nailed-group" style={{ '--c': cat.color }}>
      <button className="nailed-group-header" onClick={() => setOpen(v => !v)}>
        <div className="nailed-group-icon"><Icon size={20} /></div>
        <div className="nailed-group-info">
          <span className="nailed-group-name">{cat.name}</span>
          <span className="nailed-group-sub">{items.length} important item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="nailed-group-badge" style={{ background: `${cat.color}20`, color: cat.color }}>
          <Bookmark size={11} fill="currentColor" />
          {items.length}
        </span>
        <ChevronDown size={18} className={`nailed-group-chev${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="nailed-group-body anim-slide" style={{ padding: '8px 6px 10px', gap: 10 }}>
          {items.map(item => (
            <div
              key={item.id}
              className="practice-imp-item"
              onClick={() => onOpen(`/practice?category=${cat.id}&topic=${item.topic.id}`)}
            >
              <div className="practice-imp-item-head">
                <span className="practice-imp-tag">
                  {item.kind === 'drill' ? <Dumbbell size={11} /> : <Terminal size={11} />}
                  {item.topic.name}
                </span>
                <button
                  className="nailed-unnail-btn"
                  onClick={e => { e.stopPropagation(); onUnmark(item.id) }}
                  title="Remove from Important"
                >
                  <X size={13} />
                </button>
              </div>
              {item.kind === 'drill' && <div className="practice-imp-prompt">{item.prompt}</div>}
              {item.kind === 'drill'
                ? item.answer && <code className="practice-cmd">{item.answer}</code>
                : <code className="practice-cmd">{item.cmd}</code>}
              {item.desc && <span className="practice-cmd-desc">{item.desc}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
