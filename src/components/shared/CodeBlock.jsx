import { useMemo } from 'react'
import { highlightCode } from '../../lib/highlight.js'

// Shared syntax-highlighted <pre><code> shell for both written-Q&A code
// snippets and MCQ source listings — `className` picks the visual shell
// (background/border), `code-tokens` carries the token colors (see index.css).
export default function CodeBlock({ code, lang, className }) {
  const html = useMemo(() => highlightCode(code, lang), [code, lang])
  return (
    <pre className={className}>
      <code className="code-tokens" dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}
