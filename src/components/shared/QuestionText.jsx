// An MCQ question can carry a source listing (see the pseudocode/complexity
// items in src/data/dsa.json and the output-prediction ones in
// src/data/c_programming.json). The convention in the data is: the FIRST line is
// the prompt, every following line is code. Rendering the whole string in a <p>
// collapses the newlines and the indentation, so the code turns into an
// unreadable run-on — split it out and give the listing the same monospace shell
// the Written module uses for its snippets.

import HighlightableText from './HighlightableText.jsx'
import { useHighlights } from '../../contexts/HighlightContext.jsx'
import { guardHighlightClick } from '../../lib/textAnchor.js'

export function splitQuestion(text) {
  const s = (text ?? '').toString()
  const nl = s.indexOf('\n')
  if (nl === -1) return { prompt: s, code: '' }
  return { prompt: s.slice(0, nl).trim(), code: s.slice(nl + 1).replace(/\s+$/, '') }
}

export default function QuestionText({ text, uid, className }) {
  const { prompt, code } = splitQuestion(text)
  const { getFor } = useHighlights()
  const all = uid ? getFor(uid) : null
  const hl = (key) => all?.length ? all.filter(h => h.block === key) : undefined

  // The wrapper is display: contents — it exists only to be the highlight root
  // and generates no box, so the prompt and listing still lay out as direct
  // children of the card, exactly as before.
  return (
    <div className="hl-q-root" data-hl-root={uid || undefined} onClick={uid ? guardHighlightClick : undefined}>
      <HighlightableText as="p" className={code ? `${className} has-code` : className}
        block="q" text={prompt} highlights={hl('q')} />
      {code && (
        <pre className="q-code-pre">
          <HighlightableText as="code" block="q.code" text={code} highlights={hl('q.code')} />
        </pre>
      )}
    </div>
  )
}
