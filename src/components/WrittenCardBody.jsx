import { useState } from 'react'
import { Brain } from 'lucide-react'

export function WrittenCardBody({ a, topicColor }) {
  const [extOpen, setExtOpen] = useState(false)

  return (
    <div className="written-card-body">

      <div className="written-summary" style={{ borderColor: `${topicColor}40`, background: `color-mix(in srgb, ${topicColor} 7%, var(--elevated))` }}>
        <span className="written-summary-label" style={{ color: topicColor }}>সংক্ষেপ</span>
        <p>{a.summary}</p>
      </div>

      <ul className="written-points">
        {a.points.map((pt, i) => (
          <li key={i} className="written-point">
            <span className="written-dot" style={{ background: topicColor }} />
            <span>{pt}</span>
          </li>
        ))}
      </ul>

      {a.diagram && (
        <div className="written-diagram-wrap">
          <span className="written-block-label">Diagram</span>
          <pre className="written-diagram-pre">{a.diagram}</pre>
        </div>
      )}

      {a.table && a.table.rows?.length > 0 && (
        <div className="written-mistakes-wrap">
          <span className="written-block-label">তুলনা</span>
          <DataTable headers={a.table.headers} rows={a.table.rows} />
        </div>
      )}

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

      <div className="written-mnemonic" style={{ borderColor: `${topicColor}35`, background: `color-mix(in srgb, ${topicColor} 9%, var(--elevated))` }}>
        <Brain size={15} style={{ color: topicColor, flexShrink: 0 }} />
        <span>{a.mnemonic}</span>
      </div>

      {a.extended && (
        <div className="written-ext-section">
          <button
            className={`written-ext-toggle${extOpen ? ' open' : ''}`}
            onClick={() => setExtOpen(v => !v)}
            style={{ color: topicColor, borderColor: `${topicColor}40` }}
          >
            <span>{extOpen ? '▲' : '▼'}</span>
            <span>{a.extended.title}</span>
          </button>

          {extOpen && (
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
  )
}

export function DataTable({ headers, rows }) {
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
