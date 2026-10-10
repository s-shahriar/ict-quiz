// Shared SVG building blocks for the equation diagrams (see EQUATION_PLAN.md §5.3).
// Colours come from the --eq-* tokens (equation.css) so every diagram follows the theme.
//
// Pass coordinates as numbers, never strings: these helpers do arithmetic on them.

export const C1 = 'var(--eq-1)', C2 = 'var(--eq-2)', C3 = 'var(--eq-3)', C4 = 'var(--eq-4)'
export const tint = (c, pct = 12) => `color-mix(in srgb, ${c} ${pct}%, var(--surface))`

// Numbered badge centred on (x, y).
export function Step({ x, y, n, color }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill={color} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--surface)">{n}</text>
    </g>
  )
}

// Arrowhead with its tip at (x, y), pointing right (dir 1) or left (dir -1).
export function Head({ x, y, dir, color }) {
  return <polygon points={`${x},${y} ${x - 9 * dir},${y - 5} ${x - 9 * dir},${y + 5}`} fill={color} />
}

// Horizontal measure from x1 to x2 at height y, with its label above or below.
export function Dim({ x1, x2, y, color, label, below }) {
  return (
    <g>
      <line x1={x1} y1={y - 8} x2={x1} y2={y + 8} stroke={color} strokeWidth="1.5" />
      <line x1={x2} y1={y - 8} x2={x2} y2={y + 8} stroke={color} strokeWidth="1.5" />
      <line x1={x1 + 9} y1={y} x2={x2 - 9} y2={y} stroke={color} strokeWidth="1.5" />
      <Head x={x1 + 2} y={y} dir={-1} color={color} />
      <Head x={x2 - 2} y={y} dir={1} color={color} />
      <text x={(x1 + x2) / 2} y={below ? y + 22 : y - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{label}</text>
    </g>
  )
}

// Tinted box with a centred title and an optional second line.
export function Cell({ x, y, w, h, color, title, sub }) {
  const cx = x + w / 2, cy = y + h / 2
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="5" fill={tint(color, 20)} stroke={color} strokeWidth="1.5" />
      <text x={cx} y={sub ? cy - 2 : cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{title}</text>
      {sub && <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10.5" fill="var(--text-3)">{sub}</text>}
    </g>
  )
}

// "T" with a subscript, for use as the last thing inside an SVG <text>.
export const Tsub = ({ s }) => <>T<tspan dy="3" fontSize="9">{s}</tspan></>

// The cap a measured quantity can reach, appended to a Dim label in a quieter tone.
export const Limit = ({ children }) => <tspan fontWeight="500" fill="var(--text-3)"> · {children}</tspan>


// A routed arrow through `pts` ([[x, y], …]) with a head at the last point,
// pointing along the last segment. Use for anything that turns a corner.
export function Arrow({ pts, color, dashed, width = 1.5 }) {
  const [x1, y1] = pts[pts.length - 2]
  const [x2, y2] = pts[pts.length - 1]
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len
  // Stop the line where the head starts, so a thick stroke never pokes past the tip.
  const line = [...pts.slice(0, -1), [x2 - ux * 8, y2 - uy * 8]]
  const px = -uy * 5, py = ux * 5
  return (
    <g>
      <polyline
        points={line.map(p => p.join(',')).join(' ')}
        fill="none" stroke={color} strokeWidth={width}
        strokeDasharray={dashed ? '5 4' : undefined} strokeLinejoin="round"
      />
      <polygon
        points={`${x2},${y2} ${x2 - ux * 9 + px},${y2 - uy * 9 + py} ${x2 - ux * 9 - px},${y2 - uy * 9 - py}`}
        fill={color}
      />
    </g>
  )
}

// Vertical measure from y1 to y2 at x, label to the left (anchor end) or right.
export function VDim({ x, y1, y2, color, label, left }) {
  return (
    <g>
      <line x1={x - 8} y1={y1} x2={x + 8} y2={y1} stroke={color} strokeWidth="1.5" />
      <line x1={x - 8} y1={y2} x2={x + 8} y2={y2} stroke={color} strokeWidth="1.5" />
      <Arrow pts={[[x, (y1 + y2) / 2], [x, y1 + 1]]} color={color} />
      <Arrow pts={[[x, (y1 + y2) / 2], [x, y2 - 1]]} color={color} />
      <text x={left ? x - 12 : x + 12} y={(y1 + y2) / 2 + 4} textAnchor={left ? 'end' : 'start'}
        fontSize="12" fontWeight="700" fill={color}>{label}</text>
    </g>
  )
}

// ── Symbols, drawn the way KaTeX sets them ──────────────────────────────
// A diagram label naming a quantity must look like the same quantity inside the
// formula, so "f_max" is wrong twice over: it prints an underscore instead of a
// subscript, and it is set in the UI font next to an italic math f. KaTeX's own
// faces ship with the page (EquationMode imports katex.min.css; the prerender
// tool copies them into Slate), so the diagram can borrow them.
const MATH  = "KaTeX_Math, Georgia, 'Times New Roman', serif"   // italic variables: f, P, n
const ROMAN = "KaTeX_Main, Georgia, 'Times New Roman', serif"   // upright names: SNR, BW

/**
 * `<Sym base="f" sub="max" after=" · 1400 kHz" />` → f with a real subscript.
 *
 * `roman` for a multi-letter operator name, which KaTeX sets upright (\text{SNR}).
 * `after` is whatever follows on the normal baseline: a <tspan dy> shifts every
 * glyph after it too, so the subscript is always closed by a tspan that puts the
 * baseline back (§5.5) — even when nothing follows, hence the zero-width space.
 */
export function Sym({ base, sub, after, roman }) {
  const digits = sub != null && /^\d+$/.test(String(sub))
  return (
    <>
      <tspan fontFamily={roman ? ROMAN : MATH} fontStyle={roman ? 'normal' : 'italic'}>{base}</tspan>
      {sub != null && (
        <tspan dy="3.2" fontSize="0.74em" fontFamily={digits ? ROMAN : MATH} fontStyle={digits ? 'normal' : 'italic'}>
          {sub}
        </tspan>
      )}
      {sub != null && <tspan dy="-3.2" fontSize="1em">{after ?? '​'}</tspan>}
      {sub == null && after}
    </>
  )
}
