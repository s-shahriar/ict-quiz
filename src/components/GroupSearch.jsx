import { ArrowUpRight, Lightbulb, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useDebounce from '../hooks/useDebounce.js'
import { normalize, tokenize } from '../lib/normalize.js'
import Pagination from './shared/Pagination'

const PAGE_SIZE = 8

// Search across all MCQ questions in the given topics. Flexible matching:
// every query word must appear (in any order) in the question, options, or
// explanation. Bangla-aware via NFC normalization in lib/normalize.
export default function GroupSearch({ topics, onActiveChange }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [page, setPage]   = useState(1)
  const debounced = useDebounce(query, 250)
  const tokens = tokenize(debounced)
  const active = tokens.length > 0

  const results = useMemo(() => {
    if (!tokens.length) return []
    const out = []
    const seen = new Set() // collapse duplicate questions across topics
    for (const t of topics) {
      t.questions.forEach((q, i) => {
        if (!q.options || !q.correct_answer) return
        const key = normalize(q.question)
        if (seen.has(key)) return
        const haystack =
          key + ' ' +
          Object.values(q.options).map(normalize).join(' ') + ' ' +
          normalize(q.explanation)
        if (tokens.every(tok => haystack.includes(tok))) {
          seen.add(key)
          out.push({ q, topic: t, index: i })
        }
      })
    }
    return out
  }, [debounced, topics]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { onActiveChange?.(active) }, [active, onActiveChange])

  const [prevKey, setPrevKey] = useState(debounced)
  if (prevKey !== debounced) { setPrevKey(debounced); setPage(1) }

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const pageItems  = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="group-search">
      <div className="gs-input-wrap">
        <Search className="gs-icon" size={16} />
        <input
          className="gs-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all MCQ questions…"
          aria-label="Search questions"
        />
        {query && (
          <button className="gs-clear" onClick={() => setQuery('')} title="Clear">
            <X size={15} />
          </button>
        )}
      </div>

      {active && (
        <div className="gs-results anim-fade">
          <p className="gs-meta">
            {results.length} result{results.length !== 1 ? 's' : ''} for “{debounced.trim()}”
          </p>

          {results.length === 0 ? (
            <div className="gs-empty">
              <Search size={30} style={{ opacity: 0.35, marginBottom: 8 }} />
              <p>No questions match your search.</p>
            </div>
          ) : (
            <>
              <div className="gs-list">
                {pageItems.map(({ q, topic, index }) => (
                  <ResultCard
                    key={`${topic.id}-${q.question}`}
                    q={q}
                    topic={topic}
                    onOpen={() => navigate('/mcq/' + topic.id + '/study?q=' + index)}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ResultCard({ q, topic, onOpen }) {
  const Icon = topic.icon
  return (
    <div className="gs-card" style={{ '--c': topic.color }}>
      <button className="gs-card-topic" onClick={onOpen} title={`Open ${topic.name} in study mode`}>
        {Icon && <Icon size={13} />}
        <span>{topic.name}</span>
        <ArrowUpRight size={13} className="gs-card-open" />
      </button>

      <p className="gs-card-q">{q.question}</p>

      {q.correct_answer && q.options?.[q.correct_answer] && (
        <div className="gs-card-ans">
          <span className="gs-ans-key">{q.correct_answer.toUpperCase()}</span>
          <span className="gs-ans-text">{q.options[q.correct_answer]}</span>
        </div>
      )}

      {q.explanation && (
        <div className="gs-card-exp">
          <Lightbulb size={12} style={{ color: topic.color, flexShrink: 0, marginTop: 1 }} />
          <span>{q.explanation}</span>
        </div>
      )}
    </div>
  )
}
