import { BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft, CornerDownLeft, Dumbbell, Home, Lightbulb, Moon, Sun, Terminal, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useThemeContext } from '../contexts/ThemeContext.jsx'
import { checkAnswer, getPracticeData, normalizeCommand } from '../data/practice/index.js'

const TABS = [
  { id: 'info', label: 'Info', icon: BookOpen },
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'practice', label: 'Practice', icon: Dumbbell },
]

export default function PracticeMode() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryId = searchParams.get('category') || 'linux'
  const data = getPracticeData(categoryId)

  const topicId = searchParams.get('topic') || data?.topics?.[0]?.id
  const topic = data?.topics.find(t => t.id === topicId) || data?.topics?.[0]
  const [tab, setTab] = useState('info')

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next)
  }

  const selectTopic = (id) => { setParam('topic', id); setTab('info') }

  if (!data || !topic) {
    return (
      <div className="practice-page anim-fade">
        <div className="practice-placeholder">
          <Dumbbell size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p>এই category-তে এখনো কিছু নেই।</p>
        </div>
      </div>
    )
  }

  return (
    <div className="practice-page anim-fade">
      <div className="written-topbar practice-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'practice' } })}>
          <ChevronLeft size={15} /> Home
        </button>
        <div className="written-topic-pill practice-pill">
          <Terminal size={13} />
          {data.name} Practice
        </div>
        <div className="topbar-right-actions">
          <button className="study-home-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="study-home-btn" onClick={() => navigate('/')} title="Home">
            <Home size={16} />
          </button>
        </div>
      </div>

      {/* Topic selector — dropdown on all screen sizes */}
      <TopicDropdown topics={data.topics} current={topic} onSelect={selectTopic} />

      {/* Tabs */}
      <div className="practice-tabs">
        {TABS.map(tb => {
          const Icon = tb.icon
          return (
            <button
              key={tb.id}
              className={`practice-tab${tab === tb.id ? ' active' : ''}`}
              onClick={() => setTab(tb.id)}
            >
              <Icon size={14} /> {tb.label}
            </button>
          )
        })}
      </div>

      <div className="practice-content">
        {tab === 'info' && <InfoPanel info={topic.info} name={topic.name} />}
        {tab === 'commands' && <CommandsPanel commands={topic.commands} practice={topic.practice} />}
        {tab === 'practice' && <CommandPractice key={topic.id} problems={topic.practice} />}
      </div>
    </div>
  )
}

function TopicDropdown({ topics, current, onSelect }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="practice-topic-dropdown">
      <button className="practice-dd-trigger" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="practice-dd-current">{current.name}</span>
        <ChevronDown size={18} className={`practice-dd-chev${open ? ' open' : ''}`} />
      </button>
      {open && (
        <>
          <div className="practice-dd-backdrop" onClick={() => setOpen(false)} />
          <div className="practice-dd-menu">
            {topics.map(t => (
              <button
                key={t.id}
                className={`practice-dd-item${t.id === current.id ? ' active' : ''}`}
                onClick={() => { onSelect(t.id); setOpen(false) }}
              >
                <span>{t.name}</span>
                {t.id === current.id && <Check size={15} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InfoPanel({ info, name }) {
  if (!info) return null
  return (
    <div className="practice-info">
      <h3 className="practice-info-title">{name}</h3>
      {info.summary?.map((line, i) => (
        <p key={i} className="practice-info-line">{line}</p>
      ))}
      {info.table?.rows?.length > 0 && (
        <div className="written-table-scroll" style={{ marginTop: 14 }}>
          <table className="written-table">
            {info.table.headers && (
              <thead>
                <tr>{info.table.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {info.table.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Merge the curated command reference with every command used in practice
// (primary accepted answer), deduped — so the Commands tab is a complete list.
function buildCommandList(commands = [], practice = []) {
  const seen = new Set()
  const list = []
  const add = (cmd, desc) => {
    if (!cmd) return
    const key = normalizeCommand(cmd)
    if (seen.has(key)) return
    seen.add(key)
    list.push({ cmd, desc: desc || '' })
  }
  commands.forEach(c => add(c.cmd, c.desc))
  practice.forEach(p => add(p.accept?.[0], p.explain))
  return list
}

function CommandsPanel({ commands, practice }) {
  const list = buildCommandList(commands, practice)
  if (!list.length) return null
  return (
    <div className="practice-commands">
      {list.map((c, i) => (
        <div key={i} className="practice-cmd-row">
          <code className="practice-cmd">{c.cmd}</code>
          {c.desc && <span className="practice-cmd-desc">{c.desc}</span>}
        </div>
      ))}
    </div>
  )
}

function CommandPractice({ problems }) {
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | correct | wrong
  const [revealed, setRevealed] = useState(false)
  const [solved, setSolved] = useState(() => new Set())
  const inputRef = useRef(null)

  const total = problems?.length || 0
  const problem = problems?.[idx]

  const submit = () => {
    if (!input.trim() || status === 'correct') return
    if (checkAnswer(input, problem.accept)) {
      setStatus('correct')
      setSolved(prev => new Set(prev).add(idx))
    } else {
      setStatus('wrong')
    }
  }

  const next = () => {
    const ni = (idx + 1) % total
    goTo(ni)
  }

  const goTo = (ni) => {
    setIdx(ni)
    setInput('')
    setStatus('idle')
    setRevealed(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status === 'correct') next()
      else submit()
    }
  }

  if (!problem) return <p className="practice-info-line">এই topic-এ এখনো practice নেই।</p>

  return (
    <div className="practice-drill">
      <div className="practice-progress">
        <span>প্রশ্ন {idx + 1} / {total}</span>
        <span className="practice-score">{solved.size} solved</span>
      </div>

      <div className="practice-prompt">{problem.prompt}</div>

      <div className={`practice-terminal status-${status}`}>
        <span className="practice-dollar">$</span>
        <input
          ref={inputRef}
          className="practice-input"
          value={input}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          placeholder="command লিখে Enter চাপো..."
          onChange={e => { setInput(e.target.value); if (status === 'wrong') setStatus('idle') }}
          onKeyDown={onKeyDown}
          disabled={status === 'correct'}
        />
      </div>

      {status === 'correct' && (
        <div className="practice-feedback correct">
          <CheckCircle2 size={16} /> সঠিক!
          {problem.explain && <span className="practice-explain">{problem.explain}</span>}
        </div>
      )}
      {status === 'wrong' && (
        <div className="practice-feedback wrong">
          <XCircle size={16} /> ঠিক হয়নি — আবার চেষ্টা করো।
        </div>
      )}

      {revealed && (
        <div className="practice-answer">
          <Lightbulb size={14} /> উত্তর: <code>{problem.accept[0]}</code>
          {problem.explain && <span className="practice-explain">{problem.explain}</span>}
        </div>
      )}

      <div className="practice-actions">
        {status === 'correct' ? (
          <button className="practice-btn primary" onClick={next}>
            পরের প্রশ্ন <CornerDownLeft size={14} />
          </button>
        ) : (
          <button className="practice-btn primary" onClick={submit}>
            Check <CornerDownLeft size={14} />
          </button>
        )}
        <button className="practice-btn ghost" onClick={() => setRevealed(r => !r)}>
          {revealed ? 'উত্তর লুকাও' : 'উত্তর দেখাও'}
        </button>
        <button className="practice-btn ghost" onClick={next}>Skip →</button>
      </div>
    </div>
  )
}
