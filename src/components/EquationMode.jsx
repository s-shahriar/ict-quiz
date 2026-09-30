import 'katex/dist/katex.min.css'
import { ChevronLeft, Eye, EyeOff, LayoutGrid, Sigma } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHighlights } from '../contexts/HighlightContext.jsx'
import { EQUATION_TOPICS, getEquationData } from '../data/equation/index.js'
import { uidFor } from '../lib/qid.js'
import CategorySidebar from './CategorySidebar.jsx'
import HighlightableText from './shared/HighlightableText.jsx'
import TopbarActions from './shared/TopbarActions.jsx'
import { CoverProvider, EqRow, Mem, Symbols } from './equation/EquationHelpers.jsx'
import { DIAGRAMS } from './equation/diagrams/index.js'
import './equation/equation.css'

const COVER_KEY = 'ict-eq-cover'

export default function EquationMode() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getFor } = useHighlights()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cover, setCover] = useState(() => {
    try { return localStorage.getItem(COVER_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(COVER_KEY, cover ? '1' : '0') } catch { /* ignore */ }
  }, [cover])

  const topic = EQUATION_TOPICS.find(t => t.id === searchParams.get('topic')) || EQUATION_TOPICS[0]
  const data = topic && getEquationData(topic.id)

  if (!data) {
    return (
      <div className="eq-page anim-fade">
        <div className="written-empty">
          <Sigma size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p>এখনো কোনো equation যোগ করা হয়নি।</p>
        </div>
      </div>
    )
  }

  const scrollTo = (id) => document.getElementById('eq-' + id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="eq-page anim-fade">
      <div className="written-topbar practice-topbar">
        <button className="back-btn" onClick={() => navigate('/', { state: { module: 'equation' } })}>
          <ChevronLeft size={15} /> Home
        </button>
        <div className="written-topic-pill" style={{ color: topic.color, borderColor: `color-mix(in srgb, ${topic.color} 33%, transparent)` }}>
          <Sigma size={13} />
          {topic.shortName} — Equations
        </div>
        <TopbarActions>
          <button
            className={`study-home-btn eq-cover-btn${cover ? ' on' : ''}`}
            onClick={() => setCover(v => !v)}
            aria-pressed={cover}
            title={cover ? 'Equation দেখান (cover mode বন্ধ)' : 'Equation ঢেকে নিজেকে যাচাই করুন'}
          >
            {cover ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          {EQUATION_TOPICS.length > 1 && (
            <button className="cat-browse-btn" onClick={() => setSidebarOpen(true)} title="Browse categories">
              <LayoutGrid size={16} />
            </button>
          )}
        </TopbarActions>
      </div>

      <CategorySidebar
        topics={EQUATION_TOPICS}
        currentTopicId={topic.id}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(t) => navigate('/equation?topic=' + t.id)}
      />

      {data.groups.length > 1 && (
        <nav className="eq-jump" aria-label="Equation groups">
          {data.groups.map(g => (
            <button key={g.id} className="eq-jump-chip" onClick={() => scrollTo(g.id)}>{g.title}</button>
          ))}
        </nav>
      )}

      {cover && (
        <div className="eq-cover-banner">
          <EyeOff size={15} />
          <span>Equation ঢাকা আছে — মনে করার চেষ্টা করে, তারপর <strong>ট্যাপ করে</strong> মিলিয়ে নিন।</span>
        </div>
      )}

      <CoverProvider value={cover}>
        {data.groups.map((g, i) => {
          const Diagram = DIAGRAMS[g.diagram]
          // Highlights anchor to the group: one root per card, keyed by
          // category + group id so a saved mark survives edits to the rows.
          const uid = uidFor('equation', `${topic.id}/${g.id}`)
          const all = getFor(uid)
          const hl = (key) => all.length ? all.filter(h => h.block === key) : undefined
          return (
            <section key={g.id} className="eq-group" id={'eq-' + g.id}>
              <header className="eq-group-head">
                <span className="eq-group-num">{i + 1}</span>
                <div>
                  <h2 className="eq-group-title">{g.title}</h2>
                  {g.sub && <p className="eq-group-sub">{g.sub}</p>}
                </div>
              </header>

              <div className="eq-card" data-hl-root={uid}>
                {Diagram && (
                  <figure className="eq-diagram">
                    <div className="eq-diagram-scroll"><Diagram /></div>
                    {g.caption && (
                      <HighlightableText as="figcaption" block="caption" text={g.caption} highlights={hl('caption')} />
                    )}
                  </figure>
                )}
                {g.symbols?.length > 0 && <Symbols items={g.symbols} hl={hl} />}
                <div className="eq-list">
                  {g.equations.map(eq => <EqRow key={eq.name} eq={eq} hl={hl} />)}
                </div>
                {g.mnemonic && (
                  <Mem><HighlightableText block="mnemonic" text={g.mnemonic} highlights={hl('mnemonic')} /></Mem>
                )}
              </div>
            </section>
          )
        })}
      </CoverProvider>
    </div>
  )
}
