// An MCQ question can carry a source listing (see the pseudocode/complexity
// items in src/data/dsa.json and the output-prediction ones in
// src/data/c_programming.json). The convention in the data is: the FIRST line is
// the prompt, every following line is code. Rendering the whole string in a <p>
// collapses the newlines and the indentation, so the code turns into an
// unreadable run-on — split it out and give the listing the same monospace shell
// the Written module uses for its snippets.

export function splitQuestion(text) {
  const s = (text ?? '').toString()
  const nl = s.indexOf('\n')
  if (nl === -1) return { prompt: s, code: '' }
  return { prompt: s.slice(0, nl).trim(), code: s.slice(nl + 1).replace(/\s+$/, '') }
}

export default function QuestionText({ text, className }) {
  const { prompt, code } = splitQuestion(text)
  return (
    <>
      <p className={code ? `${className} has-code` : className}>{prompt}</p>
      {code && <pre className="q-code-pre"><code>{code}</code></pre>}
    </>
  )
}
