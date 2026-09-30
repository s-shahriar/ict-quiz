# Equation Module — Standard

The Equation tab is a formula sheet: equations grouped into families, **one diagram per
group**, with a cover-and-recall mode. This file is the contract for adding or editing
equations. Read it before touching `src/data/equation/` or the diagrams.

Reference implementation: the Computer Network category
(`src/data/equation/computer_network.js` + `src/components/equation/diagrams/computerNetwork.jsx`).

---

## 1. Where the content lives — frontend code, NOT Supabase

Equations and diagrams are bundled with the frontend, the same way general-quiz does its
math formula route (`general-quiz/src/components/utility/math-formulas/` — plain JSX
sections, nothing in the database).

Why:

- A diagram is an SVG React component. It cannot be a database row.
- An equation and its diagram are edited together; splitting them across a DB and the
  bundle would let them drift apart.
- The content is small and read-only for the user.

What this means in practice:

- Adding an equation = editing files + deploying the frontend. It is **not** live until
  the Vercel deploy.
- None of the Written workflow applies: no Supabase insert, no `sync-written.mjs`, no
  `_manifest.json` count, no `EXPECTED` bump in `seed.mjs`.
- Only **per-user** data reaches Supabase: highlights, through the existing
  `user_highlights` table (§6).

## 2. Files

| File | What it holds |
|---|---|
| `src/data/equation/<slug>.js` | One category: its groups and equations (plain data) |
| `src/data/equation/index.js` | Registry. `<slug>` must be an MCQ topic id (name/icon/colour come from it) |
| `src/components/equation/diagrams/parts.jsx` | Shared SVG helpers (`Cell`, `Dim`, `VDim`, `Arrow`, …) and colours |
| `src/components/equation/diagrams/<category>.jsx` | The SVG diagram components for that category |
| `src/components/equation/diagrams/index.js` | Merges every category's diagrams into `DIAGRAMS` |
| `src/components/equation/EquationHelpers.jsx` | `Tex`, `EqRow`, `Symbols`, `Mem`, cover context |
| `src/components/equation/equation.css` | All styling, incl. the `--eq-1…5` diagram palette |
| `src/components/EquationMode.jsx` | The `/equation?topic=<slug>` page |

## 3. Workflow when the user gives equations

They usually arrive as photos of handwritten notes.

1. **Transcribe everything**, in the user's own wording.
2. **Report what is unclear** before or with the work — never guess silently:
   - anything cut off at a photo edge or struck out;
   - every interpretation made (a renamed term, a bracket read a certain way);
   - near-duplicates kept, exact duplicates merged, anything added (a ceiling, a typical
     value). State which lines are the user's and which are additions.
3. **Group** the equations into families that share one physical picture.
4. Write the data (§4), draw the diagram (§5), run the checklist (§7).

## 4. Data format and writing rules

```js
{
  id: 'tcp-packet',            // stable — see §6 before renaming
  title: 'TCP Packet Size',
  sub: 'MSS · Total packet · Segments · Efficiency',
  diagram: 'cn-tcp-packet',    // key in DIAGRAMS
  caption: '…',                // one Bengali line under the diagram
  symbols: [[tex, meaning]],   // abbreviations, units, any non-obvious term
  equations: [{ name, lhs, rhs, rel?, note? }],
  mnemonic: '…',               // one line
}
```

**No worked examples (প্রশ্ন → ধাপ → উত্তর).** They were built once and the user removed
every one of them: the numbers belong in the diagram instead (§5.2), not in a separate
problem block under the equations. Do not add them back unless the user asks.

- `lhs` / `rhs` are KaTeX, written with `String.raw`. `rel` defaults to `=`.
- **Use the user's words in the formula** (`\text{Window size}`, `\text{RTT}`), not
  invented single-letter symbols. Use a symbol only where the notes use one (`a`, `T_t`).
- `name` is the recall cue. In cover mode `name` + `lhs` stay visible; `rhs` + `note`
  are hidden. So nothing in `name`/`lhs` may give the answer away.
- **A unit that matters goes inside the formula, on the visible side** — e.g.
  `\text{Window size (frame)} \ge 1 + 2a`, not only in the note.
- `note`: one Bengali line giving the why. Technical terms stay in English.
- **Two equations that look alike** (same quantity in a different unit or form): keep
  both if the user wrote both, and make both notes work the *same numeric example* so it
  is obvious they give the same answer (64000 bit vs 8 packet × 8000 bit → 640000 bps).
- `symbols` must define every term in the group whose meaning is not self-evident
  (e.g. `Useful data`).

## 5. Diagram standard

The diagram is what makes a group memorable. It is **a picture of the real thing, with
every quantity from the equations placed where it physically lives**.

### 5.1 The coverage rule (most important)

> Every term that appears in any equation of the group must be findable in the diagram,
> labelled with the same words the formula uses.

Before finishing, go through the equations term by term and point at each one in the
diagram. Two misses from the first build show what this catches:

- `TCP efficiency = Useful data / Total packet` — the diagram labelled the box `Data` and
  the span `MTU`, so neither `Useful data` nor `Total packet` was anywhere on it. Fixed by
  measure lines labelled `Useful data` and `Total packet`.
- Two throughput formulas (`Window size / RTT` and `Window size × Packet size / RTT`) —
  the diagram showed only "W packets". Fixed by measuring the *same* window two ways on
  the same picture: one line over all packets (`Window size · bit বা byte-এ মাপলে`) and
  one under a single packet (`Packet size`, with `Window size · packet সংখ্যায় মাপলে W টি`).

If two equations differ only by unit or form, the diagram shows **both forms side by
side on the same object**.

### 5.2 Show structure, never the formula

The diagram must still work as a cue in cover mode, so it never prints a right-hand side.
Instead the layout lets the formula be read off:

| Relationship in the formula | How the diagram shows it |
|---|---|
| a sum (`Data + IP header + TCP header`) | the parts drawn side by side in one bar |
| a total / a difference (`MTU − headers`) | a measure line spanning the parts it covers |
| a ratio (`Window size / (1 + 2a)`) | equal slots, some filled and some empty |
| a rate (`Window size / RTT`) | the amount in flight, and a line for the time it takes |
| steps in time (`T_proc + T_q + T_t + T_p`) | numbered badges left to right |

A limit is written on the measure line in a quieter tone: `Total packet · সর্বোচ্চ হলে MTU`.

When a ratio needs concrete numbers to draw (a = 2 → five slots, three filled), pick
small ones and say so in the label (`এখানে 3`).

**Show where a formula comes from, when that is the hard part.** If the user finds a
formula hard to *understand* (not just to remember), the diagram shows its derivation on
the picture, even though that reveals the formula in cover mode. The paging group is the
reference: memory drawn as a ruler marked every Page size (0, 1024, 2048, …), so
`2500 ÷ 1024 = 2.44` visibly means "2 whole pages passed", and measure lines under it
read `2 × 1024 = 2048` (labelled `Page Number × Page size`) plus `Offset 452`. The same
ruler for RAM shows `5 × 1024 = 5120 = Base Address` plus the same 452. A ruler with
numbered boundaries is the default way to explain any "divide by a size" formula.

**Put one set of concrete numbers in the diagram.** Pick small round values that divide
cleanly (Page size 1024, 6000 RPM, 16 KB / 64 B) and draw them on the picture (Logical
Address 2500 → Page 2 + Offset 452 → Frame 5 → 5572), so a value can be followed from
start to finish. Values are fine in cover mode. Where widths encode size, keep them to
scale (address bits 18 | 8 | 6; 20 ns vs 100 ns). If one part is far too small to see at
scale (a 0.02 ms transfer next to 5 ms), give it its own readable cell instead of a
hairline, with its label inside — never a label squeezed above a sliver.

### 5.3 Visual vocabulary (helpers in the diagram file)

| Helper | Meaning |
|---|---|
| `Cell` | a tinted box: one physical part (a header, a packet, a slot) |
| `Dim` / `VDim` | a horizontal / vertical measure line with end ticks and a label: a quantity spanning parts |
| `Arrow` | a routed line with a head at its last point — any arrow that turns a corner |
| `Limit` | the cap on a measured quantity, appended to a `Dim` label |
| `Step` | a numbered badge: order in time |
| `Head` | an arrowhead: direction of travel |
| dashed line / dashed box | a return path (ACK), or something empty / idle |

### 5.4 Layout and style

- Flow **left to right**. One straight picture, not a branching one.
- `viewBox` 640 wide. Text 13px for node titles, 12px for labels, 11px for secondary text.
- Colours only from the theme: `var(--eq-1…4)`, `var(--text)`, `var(--text-2)`,
  `var(--text-3)`, `var(--elevated)`, and `tint()` for fills. One colour per concept,
  reused consistently inside the diagram. Never a hex value — it would break dark mode.
- Technical terms in English. Short Bengali phrases are fine as explanatory text: SVG
  text is positioned individually, so the Bengali alignment trap of the ASCII diagrams
  does not apply here.
- One-line Bengali `caption` underneath, saying what the picture is.

### 5.5 Technical traps (each of these happened)

- Pass coordinates as **numbers** (`y={60}`), not strings: a helper doing `y + 4` on
  `"60"` yields `"604"` and the text silently disappears.
- No SVG `<marker>` with `context-stroke` — draw arrowheads with `Head` / `Arrow`.
- KaTeX only wraps after a top-level `+`, `=`, etc. Braced `{+}` never wraps, so a long
  answer written that way overflows a phone row.
- A `<tspan>` subscript shifts everything after it; use it only at the end of a `<text>`.
- Never put `overflow` on an equation row or its formula: a fraction is taller than its
  line, so it grows scrollbars on desktop. Long formulas wrap instead.
- On phones the diagram keeps its size and scrolls sideways (`min-width: 560px`);
  shrinking it makes the labels unreadable. Do not "fix" this by scaling down.

## 6. Cover mode and highlights

- Cover mode (eye button, remembered in `localStorage`) blurs `rhs` + `note`; tapping a
  row reveals it. Ported from general-quiz's math formula route.
- Highlights use the app-wide system. One `data-hl-root` per group card, uid
  `uidFor('equation', '<slug>/<group id>')`. Block keys hang off the equation **name**
  (`eq:<name>.name | .formula | .note`), the symbol (`sym:<tex>`), `caption`, `mnemonic`.
- So **renaming a group `id` or an equation `name` orphans the user's saved highlights**
  on it. Edit notes, formulas and diagrams freely; rename only when it is really needed.
- A formula is KaTeX markup, so a highlight on it always marks the whole formula.

## 7. Checklist before saying it is done

- [ ] Every equation from the user's notes is present; unclear parts and every
      interpretation are reported.
- [ ] Coverage rule (§5.1): each term of each equation is labelled in the diagram.
- [ ] No formula / right-hand side is printed in the diagram.
- [ ] Units that matter are inside the formula.
- [ ] The diagram carries one set of concrete numbers; no separate worked-example block.
- [ ] Looked at each new group in a real browser: dark and light, desktop and ~390px.
- [ ] No `.katex-error`, no page-level horizontal overflow, no scrollbars in rows.
- [ ] Cover mode: only `rhs` + `note` blur, and the diagram gives nothing away.
- [ ] `npm run build` passes.
