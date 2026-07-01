import { ArrowUpRight, Sparkles, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXTRA_TOPICS, getExtraData } from '../data/extra/index.js'
import useDebounce from '../hooks/useDebounce.js'
import { normalize, tokenize } from '../lib/normalize.js'
import Pagination from './shared/Pagination'

const PAGE_SIZE = 6

// Search across all Extra Q&A. Each question is { id, q, tags, answer:{ summary[], points[], ... } }.
export default function ExtraSearch({ onActiveChange, initialQuery = '' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery)
  const [page, setPage]   = useState(1)
  const debounced = useDebounce(query, 250)
  const tokens = tokenize(debounced)
  const active = tokens.length > 0

  const results = useMemo(() => {
    if (!tokens.length) return []
    const out = []
    const seen = new Set()
    for (const t of EXTRA_TOPICS) {
      const questions = getExtraData(t.id)?.questions || []
      for (const q of questions) {
        const key = normalize(q.q)
        if (seen.has(key)) continue
        // Match the QUESTION terms (and its tags), not the answer body —
        // results should be questions about the term, not answers that mention it.
        const haystack = key + ' ' + (q.tags || []).map(normalize).join(' ')
        if (tokens.every(tok => haystack.includes(tok))) {
          seen.add(key)
          out.push({ q, topic: t })
        }
      }
    }
    return out
  }, [debounced]) // eslint-disable-line react-hooks/exhaustive-deps

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
          placeholder="Search all Extra Q&A…"
          aria-label="Search extra questions"
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
              <p>No extra questions match your search.</p>
            </div>
          ) : (
            <>
              <div className="gs-list">
                {pageItems.map(({ q, topic }) => (
                  <ExtraResultCard
                    key={`${topic.id}-${q.id}`}
                    q={q}
                    topic={topic}
                    onOpen={() => {
                      const home = '/?module=extra&search=' + encodeURIComponent(query)
                      navigate(home, { replace: true })
                      navigate('/extra?topic=' + topic.id + '&q=' + q.id, { state: { backTo: home } })
                    }}
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

function ExtraResultCard({ q, topic, onOpen }) {
  const Icon = topic.icon
  const summary = q.answer?.summary || []
  return (
    <div className="gs-card" style={{ '--c': topic.color }}>
      <button className="gs-card-topic" onClick={onOpen} title={`Open ${topic.name} extra Q&A`}>
        {Icon && <Icon size={13} />}
        <span>{topic.name}</span>
        <ArrowUpRight size={13} className="gs-card-open" />
      </button>

      <p className="gs-card-q">{q.q}</p>

      {summary.length > 0 && (
        <div className="gs-card-exp">
          <Sparkles size={12} style={{ color: topic.color, flexShrink: 0, marginTop: 1 }} />
          <span>{summary.slice(0, 2).join(' ')}</span>
        </div>
      )}

      {q.tags?.length > 0 && (
        <div className="gs-tags">
          {q.tags.slice(0, 5).map(tag => <span key={tag} className="gs-tag">{tag}</span>)}
        </div>
      )}
    </div>
  )
}
