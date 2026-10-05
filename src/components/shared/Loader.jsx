// ICT Quiz's branded loader: a chip whose bolt traces itself, holds, then rubs out.
//   <Loader />                     centred in the available area
//   <Loader label="Loading…" />    with a caption
//   <Loader inline />              small, sits in a line of text / button
//   <Loader bar />                 thin indeterminate bar
// Colours come from the theme tokens (--accent, --text-3), so light and dark both work.
export function ChipMark({ size = 56 }) {
  return (
    <svg className="ql-mark" width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <g className="ql-pins" strokeWidth="3" strokeLinecap="round">
        {[24, 32, 40].map(p => (
          <g key={p}>
            <path d={`M${p} 8v8M${p} 48v8`} />
            <path d={`M8 ${p}h8M48 ${p}h8`} />
          </g>
        ))}
      </g>
      <rect className="ql-body" x="16" y="16" width="32" height="32" rx="7" strokeWidth="3" />
      <path className="ql-bolt" pathLength="1" d="M35 20 25 34h7l-3 10 10-15h-7z" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export default function Loader({ label, inline = false, bar = false, size, className = '' }) {
  if (bar) {
    return <div className={`ql-bar ${className}`} role="progressbar" aria-busy="true" aria-label={label || 'Loading'}><span /></div>
  }
  if (inline) {
    return (
      <span className={`ql-inline ${className}`} role="status" aria-busy="true" aria-label={label || 'Loading'}>
        <ChipMark size={size || 18} />
        {label ? <span className="ql-label">{label}</span> : null}
      </span>
    )
  }
  return (
    <div className={`ql-wrap ${className}`} role="status" aria-busy="true" aria-live="polite">
      <ChipMark size={size || 56} />
      <p className="ql-label">{label || 'Loading…'}</p>
    </div>
  )
}
