import { useState } from 'react'
import { Brain } from 'lucide-react'
import CodeBlock from './shared/CodeBlock.jsx'
import HighlightableText from './shared/HighlightableText.jsx'
import { useHighlights } from '../contexts/HighlightContext.jsx'

// Every piece of answer prose is wrapped in <HighlightableText> with a stable
// BLOCK KEY describing where it sits in the payload ('summary.1', 'points.7',
// 'table.r2.c1', 'mnemonic', …). The key is what a saved highlight is anchored
// to, so it must stay the same in every browser and across renders — it is
// derived from the payload's own structure, never from render order or the DOM.
//
// Code blocks are deliberately NOT highlightable: Prism splits them into nested
// token spans, so character offsets there would not survive a re-render. ASCII
// diagrams are plain text and are included.

// `points` is normally a flat bullet list, but an item can also be a
// `{ code, codeLang, label }` block (e.g. a per-pattern loop snippet) or a
// `{ diagram, label }` block (e.g. a per-protocol sequence diagram) — those
// render as standalone boxes, breaking the list into separate <ul> chunks
// around them instead of becoming a bullet themselves. Use this to put a
// diagram right after the section it illustrates, instead of one combined
// diagram dumped at the end of a multi-topic answer.
function renderPoints(points, topicColor, hl) {
  // An answer may carry no `points` at all — a short one where a single
  // diagram does the whole job, for instance.
  if (!Array.isArray(points) || points.length === 0) return null
  const blocks = []
  let currentList = []
  const flushList = () => {
    if (currentList.length === 0) return
    blocks.push(<ul className="written-points" key={`ul-${blocks.length}`}>{currentList}</ul>)
    currentList = []
  }

  points.forEach((pt, i) => {
    if (pt && typeof pt === 'object' && pt.code) {
      flushList()
      blocks.push(
        <div className="written-code-wrap" key={`code-${i}`}>
          <span className="written-block-label">{pt.label || pt.codeLang || 'Code'}</span>
          <CodeBlock code={pt.code} lang={pt.codeLang} className="written-code-pre" />
        </div>
      )
      return
    }
    if (pt && typeof pt === 'object' && pt.diagram) {
      flushList()
      blocks.push(
        <div className="written-diagram-wrap" key={`diagram-${i}`}>
          <span className="written-block-label">{pt.label || 'Diagram'}</span>
          <HighlightableText as="pre" className="written-diagram-pre"
            block={`points.${i}.diagram`} text={pt.diagram} highlights={hl(`points.${i}.diagram`)} />
        </div>
      )
      return
    }
    const isSub = typeof pt === 'object' && pt.sub
    const key = `points.${i}`
    currentList.push(
      <li key={i} className={isSub ? 'written-point written-subpoint' : 'written-point'}
        style={isSub ? { '--subpoint-color': topicColor } : {}}>
        {isSub
          ? <span className="written-subpoint-indent" />
          : <span className="written-dot" style={{ background: topicColor }} />}
        <HighlightableText block={key} text={isSub ? pt.sub : pt} highlights={hl(key)} />
      </li>
    )
  })
  flushList()
  return blocks
}

export function WrittenCardBody({ a, topicColor, uid }) {
  const [extOpen, setExtOpen] = useState(false)
  const { getFor } = useHighlights()

  const all = uid ? getFor(uid) : null
  // Highlights for one block key. Nothing saved for this question -> undefined,
  // and HighlightableText renders exactly what it did before this feature.
  const hl = (key) => all?.length ? all.filter(h => h.block === key) : undefined

  return (
    <div className="written-card-body" data-hl-root={uid || undefined}>

      {/* Code snippet the question refers to (if provided) — kept out of the
          question text itself so the collapsed header stays readable. */}
      {a.code && (
        <div className="written-code-wrap">
          <span className="written-block-label">{a.codeLang || 'Code'}</span>
          <CodeBlock code={a.code} lang={a.codeLang} className="written-code-pre" />
        </div>
      )}

      {/* Question image (if provided) */}
      {a.image && (
        <div className="written-question-img-wrap">
          <img src={a.image} alt="question diagram" className="written-question-img" />
        </div>
      )}

      <div className="written-summary" style={{ borderColor: `${topicColor}40`, background: `color-mix(in srgb, ${topicColor} 7%, var(--elevated))` }}>
        <span className="written-summary-label" style={{ color: topicColor }}>সংক্ষেপ</span>
        {Array.isArray(a.summary)
          ? <div className="written-summary-lines">
              {a.summary.map((line, i) => (
                <HighlightableText key={i} as="p" className="written-summary-line"
                  block={`summary.${i}`} text={line} highlights={hl(`summary.${i}`)} />
              ))}
            </div>
          : <HighlightableText as="p" block="summary" text={a.summary} highlights={hl('summary')} />}
      </div>

      {renderPoints(a.points, topicColor, hl)}

      {a.diagram && (
        <div className="written-diagram-wrap">
          <span className="written-block-label">Diagram</span>
          <HighlightableText as="pre" className="written-diagram-pre"
            block="diagram" text={a.diagram} highlights={hl('diagram')} />
        </div>
      )}

      {a.table && a.table.rows?.length > 0 && (
        <div className="written-mistakes-wrap">
          <span className="written-block-label">তুলনা</span>
          <DataTable headers={a.table.headers} rows={a.table.rows} prefix="table" hl={hl} />
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
                    {row.map((cell, j) => (
                      <HighlightableText key={j} as="td" block={`mistakes.r${i}.c${j}`}
                        text={cell} highlights={hl(`mistakes.r${i}.c${j}`)} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="written-mnemonic" style={{ borderColor: `${topicColor}35`, background: `color-mix(in srgb, ${topicColor} 9%, var(--elevated))` }}>
        <Brain size={15} style={{ color: topicColor, flexShrink: 0 }} />
        <HighlightableText block="mnemonic" text={a.mnemonic} highlights={hl('mnemonic')} />
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
                  <HighlightableText block={`ext.points.${i}`} text={pt} highlights={hl(`ext.points.${i}`)} />
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
                          {row.map((cell, j) => (
                            <HighlightableText key={j} as="td" block={`ext.table.r${i}.c${j}`}
                              text={cell} highlights={hl(`ext.table.r${i}.c${j}`)} />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {a.extended.diagram && (
                <div className="written-diagram-wrap" style={{ marginTop: 16 }}>
                  <span className="written-block-label">Diagram</span>
                  <HighlightableText as="pre" className="written-diagram-pre"
                    block="ext.diagram" text={a.extended.diagram} highlights={hl('ext.diagram')} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export function DataTable({ headers, rows, prefix, hl }) {
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
              {row.map((cell, j) => (prefix && hl)
                ? <HighlightableText key={j} as="td" block={`${prefix}.r${i}.c${j}`}
                    text={cell} highlights={hl(`${prefix}.r${i}.c${j}`)} />
                : <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
