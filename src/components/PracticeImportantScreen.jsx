import { Bookmark, ChevronLeft, Dumbbell, Eye, EyeOff, Terminal, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useImportantContext } from '../contexts/ImportantContext.jsx'
import { useWeakContext } from '../contexts/WeakContext.jsx'
import { PRACTICE_CATEGORIES, buildCommandList, getPracticeData, practiceCmdId, usePracticeReady } from '../data/practice/index.js'
import TopbarActions from './shared/TopbarActions.jsx'
import CategoryChipBar from './CategoryChipBar.jsx'
import WeakButton from './shared/WeakButton.jsx'
import WeakOnlyBar from './shared/WeakOnlyBar.jsx'

export default function PracticeImportantScreen() {
  const navigate = useNavigate()
  usePracticeReady()
  const { value: important, remove: onUnmark } = useImportantContext()
  const { value: weak, remove: onUnweak } = useWeakContext()
  const [activeId, setActiveId] = useState(null)
  const [weakOnly, setWeakOnly] = useState(false)

  // Groups of items marked in `marked` — Important, or its Weak subset.
  const collect = (marked) => PRACTICE_CATEGORIES.map(cat => {
    const data = getPracticeData(cat.id)
    if (!data) return null
    const items = []
    for (const topic of data.topics || []) {
      const seen = new Set()
      // Drills first (keyed by their primary command); a command card sharing
      // that id is the same mark, so skip it to avoid listing it twice.
      ;(topic.practice || []).forEach(p => {
        const id = practiceCmdId(cat.id, topic.id, p.accept?.[0] || '')
        if (p.accept?.[0] && marked.has(id) && !seen.has(id)) {
          seen.add(id)
          items.push({ kind: 'drill', id, topic, prompt: p.prompt, answer: p.accept[0], desc: p.explain })
        }
      })
      buildCommandList(topic.commands, topic.practice).forEach(c => {
        const id = practiceCmdId(cat.id, topic.id, c.key)
        if (marked.has(id) && !seen.has(id)) {
          seen.add(id)
          items.push({ kind: 'cmd', id, topic, cmd: c.cmds[0], desc: c.desc })
        }
      })
    }
    return { cat, items }
  }).filter(g => g && g.items.length > 0)
  const count = (gs) => gs.reduce((s, g) => s + g.items.length, 0)

  const importantGroups = collect(important)
  const weakGroups = collect(weak)
  const groups = weakOnly ? weakGroups : importantGroups
  const total = count(groups)
  const activeGroup = groups.find(g => g.cat.id === activeId) || groups[0]

  return (
    <div className="nailed-screen nailed-screen--wide anim-fade">
      <div className="nailed-screen-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'practice' } })}>
          <ChevronLeft size={15} /> Back
        </button>
        <div className="nailed-screen-title">
          <Bookmark size={16} fill="currentColor" style={{ color: 'var(--imp)' }} />
          Important — Practice
        </div>
        <TopbarActions />
      </div>

      {importantGroups.length === 0 ? (
        <div className="nailed-screen-empty">
          <Bookmark size={48} style={{ color: 'var(--imp)', opacity: 0.3 }} />
          <p>No important practice items yet.</p>
          <span>Open any Practice category and tap the <Bookmark size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> icon on a drill or command to save it here.</span>
        </div>
      ) : (
        <>
          <div className="nailed-screen-summary">
            <span className="nailed-screen-total important-total">{total}</span>
            <span className="nailed-screen-total-label">important practice item{total !== 1 ? 's' : ''} across {groups.length} categor{groups.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <WeakOnlyBar weakOnly={weakOnly} onChange={setWeakOnly} importantCount={count(importantGroups)} weakCount={count(weakGroups)} />
          {total === 0
            ? <div className="nailed-screen-hint">এখনো কোনো Weak প্রশ্ন নেই</div>
            : (
              <button className="practice-runall-btn" onClick={() => navigate('/practice/important/run' + (weakOnly ? '?weak=1' : ''))}>
                <Dumbbell size={16} /> সব {weakOnly ? 'Weak' : 'Important'} practice করো ({total})
              </button>
            )}

          <CategoryChipBar
            groups={groups.map(({ cat, items }) => ({ topic: { ...cat, icon: cat.icon || Terminal }, items }))}
            activeId={activeGroup?.cat.id}
            onSelect={setActiveId}
          />

          {activeGroup && (
            <div className="nailed-screen-list anim-fade" style={{ '--c': activeGroup.cat.color }}>
              {activeGroup.items.map(item => (
                <ImportantItem
                  key={item.id}
                  item={item}
                  weakOnly={weakOnly}
                  onRemove={() => (weakOnly ? onUnweak : onUnmark)(item.id)}
                  onPractice={() => navigate(
                    `/practice/important/run?at=${encodeURIComponent(item.id)}${weakOnly ? '&weak=1' : ''}`,
                  )}
                  onOpenTopic={() => navigate(`/practice?category=${activeGroup.cat.id}&topic=${item.topic.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * One saved item. A drill is a question, so the card never prints its answer —
 * it offers the same typing practice the Practice tab gives, and keeps the
 * answer behind a toggle for when it is being used as a reference. A saved
 * reference command has no question to spoil, so its command stays visible.
 */
function ImportantItem({ item, weakOnly, onRemove, onPractice, onOpenTopic }) {
  const [revealed, setRevealed] = useState(false)
  const isDrill = item.kind === 'drill'
  const stop = (fn) => (e) => { e.stopPropagation(); fn() }
  return (
    <div className="practice-imp-item" onClick={onOpenTopic}>
      <div className="practice-imp-item-head">
        <span className="practice-imp-tag">
          {isDrill ? <Dumbbell size={11} /> : <Terminal size={11} />}
          {item.topic.name}
        </span>
        <WeakButton uid={item.id} className="nailed-unnail-btn nailed-weak-btn" size={13} />
        <button
          className="nailed-unnail-btn"
          onClick={stop(onRemove)}
          title={weakOnly ? 'Remove from Weak' : 'Remove from Important'}
        >
          <X size={13} />
        </button>
      </div>

      {isDrill && <div className="practice-imp-prompt">{item.prompt}</div>}

      <div className="practice-imp-actions">
        <button className="practice-imp-run-btn" onClick={stop(onPractice)}>
          <Dumbbell size={13} /> এটি practice করো
        </button>
        {isDrill && (item.answer || item.desc) && (
          <button className="practice-imp-reveal-btn" onClick={stop(() => setRevealed(v => !v))}>
            {revealed ? <><EyeOff size={13} /> উত্তর লুকাও</> : <><Eye size={13} /> উত্তর দেখাও</>}
          </button>
        )}
      </div>

      {!isDrill && <code className="practice-cmd">{item.cmd}</code>}
      {isDrill && revealed && item.answer && <code className="practice-cmd">{item.answer}</code>}
      {item.desc && (!isDrill || revealed) && <span className="practice-cmd-desc">{item.desc}</span>}
    </div>
  )
}
