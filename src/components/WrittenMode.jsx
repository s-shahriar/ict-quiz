import { useState } from 'react'
import { ChevronLeft, Home, ChevronDown, ChevronUp, Brain, BookOpenText, PenLine } from 'lucide-react'

export default function WrittenMode({ topic, writtenData, onBack, onHome }) {
  const questions = writtenData?.questions || []
  const [openId, setOpenId] = useState(questions[0]?.id ?? null)
  const [extOpen, setExtOpen] = useState({})

  const toggleCard = (id) => setOpenId(prev => prev === id ? null : id)
  const toggleExt  = (id) => setExtOpen(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="written-page anim-fade">
      <div className="written-topbar">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={15} /> All Categories
        </button>
        <div className="written-topic-pill" style={{ color: topic.color, borderColor: `${topic.color}55` }}>
          <PenLine size={13} />
          {topic.shortName} — Written Q&amp;A
        </div>
        <button className="study-home-btn" onClick={onHome} title="Home">
          <Home size={16} />
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="written-empty">
          <BookOpenText size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p>এই topic-এ এখনো কোনো written প্রশ্ন নেই।</p>
        </div>
      ) : (
        <>
          <p className="section-label" style={{ marginBottom: 16 }}>
            {questions.length} টি প্রশ্ন
          </p>
          <div className="written-list">
            {questions.map((q, idx) => (
              <WrittenCard
                key={q.id}
                q={q}
                idx={idx}
                topicColor={topic.color}
                isOpen={openId === q.id}
                isExtOpen={!!extOpen[q.id]}
                onToggle={() => toggleCard(q.id)}
                onToggleExt={() => toggleExt(q.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function WrittenCard({ q, idx, topicColor, isOpen, isExtOpen, onToggle, onToggleExt }) {
  const a = q.answer

  return (
    <div className={`written-card${isOpen ? ' open' : ''}`} style={{ '--c': topicColor }}>

      {/* ── Header ── */}
      <button className="written-card-header" onClick={onToggle}>
        <span className="written-qnum" style={{ color: topicColor }}>Q{idx + 1}</span>
        <span className="written-qtext">{q.q}</span>
        <span className="written-chevron">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* ── Body ── */}
      {isOpen && (
        <div className="written-card-body anim-slide">

          {/* Summary */}
          <div className="written-summary" style={{ borderColor: `${topicColor}40`, background: `color-mix(in srgb, ${topicColor} 7%, var(--elevated))` }}>
            <span className="written-summary-label" style={{ color: topicColor }}>সংক্ষেপ</span>
            <p>{a.summary}</p>
          </div>

          {/* Bullet points */}
          <ul className="written-points">
            {a.points.map((pt, i) => (
              <li key={i} className="written-point">
                <span className="written-dot" style={{ background: topicColor }} />
                <span>{pt}</span>
              </li>
            ))}
          </ul>

          {/* Diagram */}
          {a.diagram && (
            <div className="written-diagram-wrap">
              <span className="written-block-label">Diagram</span>
              <pre className="written-diagram-pre">{a.diagram}</pre>
            </div>
          )}

          {/* Comparison / data table */}
          {a.table && a.table.rows?.length > 0 && (
            <div className="written-mistakes-wrap">
              <span className="written-block-label">তুলনা</span>
              <DataTable headers={a.table.headers} rows={a.table.rows} />
            </div>
          )}

          {/* Common mistakes table */}
          {a.mistakes && a.mistakes.length > 0 && (
            <div className="written-mistakes-wrap">
              <span className="written-block-label">সাধারণ ভুল</span>
              <div className="written-table-scroll">
                <table className="written-table">
                  <thead>
                    <tr>
                      <th>❌ ভুল ধারণা</th>
                      <th>✅ আসল কথা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.mistakes.map((row, i) => (
                      <tr key={i}>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mnemonic */}
          <div className="written-mnemonic" style={{ borderColor: `${topicColor}35`, background: `color-mix(in srgb, ${topicColor} 9%, var(--elevated))` }}>
            <Brain size={15} style={{ color: topicColor, flexShrink: 0 }} />
            <span>{a.mnemonic}</span>
          </div>

          {/* Extended toggle + block */}
          {a.extended && (
            <div className="written-ext-section">
              <button
                className={`written-ext-toggle${isExtOpen ? ' open' : ''}`}
                onClick={onToggleExt}
                style={{ color: topicColor, borderColor: `${topicColor}40` }}
              >
                <span>{isExtOpen ? '▲' : '▼'}</span>
                <span>{a.extended.title}</span>
              </button>

              {isExtOpen && (
                <div className="written-extended anim-slide">

                  {a.extended.points?.map((pt, i) => (
                    <div key={i} className="written-point" style={{ marginBottom: 8 }}>
                      <span className="written-dot" style={{ background: topicColor }} />
                      <span>{pt}</span>
                    </div>
                  ))}

                  {a.extended.table?.length > 0 && (
                    <div className="written-table-scroll" style={{ marginTop: 16 }}>
                      <table className="written-table written-table-alt">
                        {a.extended.tableHeaders && (
                          <thead>
                            <tr>
                              {a.extended.tableHeaders.map((h, i) => <th key={i}>{h}</th>)}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {a.extended.table.map((row, i) => (
                            <tr key={i} className={row[0] === 'RAID 5' ? 'highlight-row' : ''}>
                              {row.map((cell, j) => <td key={j}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {a.extended.diagram && (
                    <div className="written-diagram-wrap" style={{ marginTop: 16 }}>
                      <span className="written-block-label">Diagram</span>
                      <pre className="written-diagram-pre">{a.extended.diagram}</pre>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function DataTable({ headers, rows }) {
  return (
    <div className="written-table-scroll">
      <table className="written-table">
        {headers && (
          <thead>
            <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
