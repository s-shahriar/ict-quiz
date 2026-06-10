import { Bookmark, BookOpen, Check, CheckCircle2, ChevronDown, ChevronLeft, CornerDownLeft, Dumbbell, Home, Lightbulb, Moon, Sun, Table2, Terminal, XCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useThemeContext } from '../contexts/ThemeContext.jsx'
import { buildCommandList, checkAnswer, getPracticeData, practiceCmdId } from '../data/practice/index.js'

const TABS = [
  { id: 'info', label: 'Info', icon: BookOpen },
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'practice', label: 'Practice', icon: Dumbbell },
]

export default function PracticeMode() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeContext()
  const { value: important, toggle: toggleImportant } = useImportantContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const categoryId = searchParams.get('category') || 'linux'
  const data = getPracticeData(categoryId)

  const topicId = searchParams.get('topic') || data?.topics?.[0]?.id
  const topic = data?.topics.find(t => t.id === topicId) || data?.topics?.[0]
  const [tab, setTab] = useState('info')

  // Sample tables can differ per topic or per set (e.g. SET A's Employee
  // topics vs its Hospital problem; SET B's employee/branch/salary). Resolve in
  // order: the topic's own sampleData, then the set-specific schema, then the
  // category-wide default.
  const sampleData = topic?.sampleData
    || (topic?.set && data?.sampleDataBySet?.[topic.set])
    || data?.sampleData

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next)
  }

  const selectTopic = (id) => { setParam('topic', id); setTab('info') }

  // Importance is keyed by command string (see practiceCmdId) so the same item
  // is marked in both the Practice and Commands tabs. A drill keys off its
  // primary command (accept[0]).
  const cmdImpId = (cmd) => practiceCmdId(categoryId, topic?.id, cmd)

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
        {tab === 'commands' && <>
          <SampleTables data={sampleData} />
          <CommandsPanel commands={topic.commands} practice={topic.practice}
            important={important} makeId={cmdImpId} onToggleImportant={toggleImportant} />
        </>}
        {tab === 'practice' && <>
          <SampleTables data={sampleData} />
          <CommandPractice key={topic.id} problems={topic.practice}
            important={important} onToggleImportant={toggleImportant}
            idOf={p => cmdImpId(p.accept?.[0])} ciOf={() => categoryId === 'sql'} />
        </>}
      </div>
    </div>
  )
}

function TopicDropdown({ topics, current, onSelect }) {
  const [open, setOpen] = useState(false)
  // Group topics by their `set` label (e.g. "A" / "B") so the menu shows
  // "SET A" / "SET B" section headers. Categories without a `set` (e.g. Linux)
  // collapse into one flat, header-less list.
  const groups = []
  topics.forEach(t => {
    const key = t.set || ''
    let g = groups.find(x => x.key === key)
    if (!g) { g = { key, items: [] }; groups.push(g) }
    g.items.push(t)
  })
  const showHeaders = groups.some(g => g.key)
  return (
    <div className="practice-topic-dropdown">
      <button className="practice-dd-trigger" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="practice-dd-current">
          {current.set ? `SET ${current.set} · ` : ''}{current.name}
        </span>
        <ChevronDown size={18} className={`practice-dd-chev${open ? ' open' : ''}`} />
      </button>
      {open && (
        <>
          <div className="practice-dd-backdrop" onClick={() => setOpen(false)} />
          <div className="practice-dd-menu">
            {groups.map(g => (
              <div key={g.key || '_'} className="practice-dd-group">
                {showHeaders && g.key && (
                  <div className="practice-dd-group-label">SET {g.key}</div>
                )}
                {g.items.map(t => (
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

// Collapsible sample-data panel so users can relate queries to real rows.
// Renders nothing for categories without sampleData (e.g. Linux).
function SampleTables({ data }) {
  const [open, setOpen] = useState(true)
  if (!data) return null
  const tables = Object.entries(data)
  if (!tables.length) return null
  return (
    <div className="sample-data">
      <button className="sample-data-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <Table2 size={14} />
        <span>Sample Data</span>
        <span className="sample-data-hint">— query গুলো এই rows-এর উপর চলে</span>
        <ChevronDown size={16} className={`sample-data-chev${open ? ' open' : ''}`} />
      </button>
      {open && (
        <div className="sample-data-tables">
          {tables.map(([name, t]) => (
            <div key={name} className="sample-table-block">
              <div className="sample-table-name">{name}</div>
              <div className="sample-table-scroll">
                <table className="sample-table">
                  <thead>
                    <tr>{t.columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, i) => (
                      <tr key={i}>{row.map((cell, j) => (
                        <td key={j}>{cell === null ? <span className="sample-null">NULL</span> : cell}</td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommandsPanel({ commands, practice, important, makeId, onToggleImportant }) {
  const list = buildCommandList(commands, practice)
  const [impOnly, setImpOnly] = useState(false)
  if (!list.length) return null
  const isImp = (cmd) => important?.has(makeId(cmd))
  const importantCount = list.filter(c => isImp(c.cmd)).length
  const visible = impOnly ? list.filter(c => isImp(c.cmd)) : list
  return (
    <div className="practice-commands">
      <div className="study-filter-bar">
        <button
          className={`study-filter-btn${!impOnly ? ' active' : ''}`}
          onClick={() => setImpOnly(false)}
          style={!impOnly ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-light)' } : {}}
        >
          সব ({list.length})
        </button>
        <button
          className={`study-filter-btn${impOnly ? ' active' : ''}`}
          onClick={() => setImpOnly(true)}
          style={impOnly ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' } : {}}
        >
          <Bookmark size={11} fill={impOnly ? 'currentColor' : 'none'} />
          Important ({importantCount})
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="practice-info-line">কোনো important command নেই — 🔖 চিহ্নে ট্যাপ করে যোগ করো।</p>
      ) : visible.map((c, i) => (
        <div key={i} className="practice-cmd-row">
          <div className="practice-cmd-head">
            <code className="practice-cmd">{c.cmd}</code>
            <button
              className={`practice-imp-btn${isImp(c.cmd) ? ' marked' : ''}`}
              onClick={() => onToggleImportant(makeId(c.cmd))}
              title={isImp(c.cmd) ? 'Remove from Important' : 'Mark as Important'}
            >
              <Bookmark size={14} fill={isImp(c.cmd) ? 'currentColor' : 'none'} />
            </button>
          </div>
          {c.desc && <span className="practice-cmd-desc">{c.desc}</span>}
        </div>
      ))}
    </div>
  )
}

export function CommandPractice({ problems, important, onToggleImportant, idOf, ciOf = () => false, showFilter = true, showTopicTag = false }) {
  const [impOnly, setImpOnly] = useState(false)
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | correct | wrong
  const [revealed, setRevealed] = useState(false)
  const [solved, setSolved] = useState(() => new Set())
  const inputRef = useRef(null)

  const all = problems || []
  // Importance is keyed by command string (via idOf) — the same key the
  // Commands tab uses — so marking it here also marks it there.
  const drillId = (p) => idOf(p)
  const isImp = (p) => { const id = idOf(p); return !!id && important?.has(id) }
  const importantCount = all.filter(isImp).length

  // Pool the user is cycling through, carrying each item's original index so
  // the solved-set stays stable when the filter is toggled.
  const pool = all.map((p, i) => ({ p, i })).filter(x => !impOnly || isImp(x.p))
  const total = pool.length
  const viewIdx = total ? Math.min(idx, total - 1) : 0
  const current = pool[viewIdx]

  const reset = () => { setInput(''); setStatus('idle'); setRevealed(false) }
  const goTo = (ni) => { setIdx(ni); reset(); requestAnimationFrame(() => inputRef.current?.focus()) }
  const next = () => { if (total) goTo((viewIdx + 1) % total) }
  const prev = () => { if (total) goTo((viewIdx - 1 + total) % total) }
  const setFilter = (v) => { setImpOnly(v); setIdx(0); reset() }

  const submit = () => {
    if (!input.trim() || status === 'correct' || !current) return
    if (checkAnswer(input, current.p.accept, { caseInsensitive: ciOf(current.p) })) {
      setStatus('correct')
      setSolved(prev => new Set(prev).add(current.i))
    } else {
      setStatus('wrong')
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status === 'correct') next()
      else submit()
    }
  }

  const filterBar = showFilter ? (
    <div className="study-filter-bar">
      <button
        className={`study-filter-btn${!impOnly ? ' active' : ''}`}
        onClick={() => setFilter(false)}
        style={!impOnly ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-light)' } : {}}
      >
        সব ({all.length})
      </button>
      <button
        className={`study-filter-btn${impOnly ? ' active' : ''}`}
        onClick={() => setFilter(true)}
        style={impOnly ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.12)' } : {}}
      >
        <Bookmark size={11} fill={impOnly ? 'currentColor' : 'none'} />
        Important ({importantCount})
      </button>
    </div>
  ) : null

  if (!current) {
    return (
      <div className="practice-drill">
        {filterBar}
        <p className="practice-info-line">
          {impOnly ? 'কোনো important practice নেই — 🔖 চিহ্নে ট্যাপ করে যোগ করো।' : 'এই topic-এ এখনো practice নেই।'}
        </p>
      </div>
    )
  }

  const problem = current.p

  return (
    <div className="practice-drill">
      {filterBar}
      <div className="practice-progress">
        <span>প্রশ্ন {viewIdx + 1} / {total}</span>
        <span className="practice-score">{solved.size} solved</span>
      </div>

      {showTopicTag && problem._topicName && (
        <div className="practice-topic-tag">{problem._catName ? problem._catName + ' · ' : ''}{problem._topicName}</div>
      )}

      <div className="practice-prompt-row">
        <div className="practice-prompt">{problem.prompt}</div>
        <button
          className={`practice-imp-btn${isImp(current.p) ? ' marked' : ''}`}
          onClick={() => onToggleImportant(drillId(current.p))}
          title={isImp(current.p) ? 'Remove from Important' : 'Mark as Important — পারি না, পরে practice করব'}
        >
          <Bookmark size={16} fill={isImp(current.p) ? 'currentColor' : 'none'} />
        </button>
      </div>

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
          readOnly={status === 'correct'}
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
          <span className="practice-answer-label"><Lightbulb size={14} /> উত্তর:</span>
          {(problem.answers?.length ? problem.answers : [problem.accept[0]]).map((a, i) => (
            <code key={i}>{a}</code>
          ))}
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
        <button className="practice-btn ghost" onClick={prev} disabled={total < 2} title="আগের প্রশ্ন">
          <ChevronLeft size={14} /> আগের
        </button>
        <button className="practice-btn ghost" onClick={next} disabled={total < 2}>Skip →</button>
      </div>
    </div>
  )
}
