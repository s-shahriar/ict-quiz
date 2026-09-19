# ict-quiz — working notes for Claude

## Before writing or editing ANY written Q&A answer

Read `WRITTEN_QA_PLAN.md` first — §3 (answer format), §3.1 (one idea per line),
**§3.2 (math/formula style — mandatory)**, §7 (visualization standard) and §7.1/§7.2
(the two alignment traps). Those sections are the contract for content; the rules
below are the short version.

**Language & style**
- Answers are in Bengali; **technical terms stay in English** — never translate one
  (not in a note, not in a diagram label). An analogy may support a term, never replace it.
- Explain the real mechanism ("why"), not a circular restatement of the term.
- One idea per `points` / `{sub}` line. No emoji bullets, no `→ ... → ...` arrow chains
  inside sentences.
- Keep it exam-ready and short — required info only.
- Conceptual questions end with a `ব্যবহারিক প্রয়োগ:` block (1–3 `{sub}` lines).
- Every answer ends with a `mnemonic`.

**Math, formulas, complexity (§3.2 — the user explicitly asked that this be followed
in every future chat)**
- Never assert a formula. **Derive it**: count the parts on the small concrete example
  the answer already uses, one step per line with the arithmetic visible, then name the
  general term each number maps to, say what Big-O drops, and finish with one
  realistic scale comparison.
- Put the derivation inside the `diagram`, right under the structure it explains.
- Exam-numeric topics (EAT, TLB, heap height, RAID, hash load factor…) also get a small
  worked problem: `প্রশ্ন` (with (ক)/(খ) parts) → `সমাধান: দেওয়া আছে` → `ধাপ ১, ২…` → `উত্তর`.
- Never a dense paragraph of summation.

**Diagrams**
- Rich labelled ASCII, not a bare sketch; reference example is `server_003`.
- Flows go **left-to-right**, one straight chain per case (e.g. a hit chain, then a miss
  chain below it) — not one branching diagram, not top-to-bottom.
- Alignment: Bengali is NOT fixed-width, so it may only ever **trail** after the last
  aligned character — never between two columns that must line up, never inside a box.
  Only ASCII/box-drawing/digits may participate in column alignment.
- Multi-topic answers: one `{diagram, label}` point per topic, placed inline right after
  that topic's lines — never one combined diagram at the end.

## Adding or editing a written question (content lives in Supabase, not the bundle)

`src/data/written/*.json` is the source of truth, but the app serves questions from the
Supabase `questions` table. **Never run `scripts/seed.mjs`** — it wipes and reseeds everything.

1. Add/edit the item in `src/data/written/<slug>.json` (`JSON.stringify(data, null, 2) + '\n'`
   reproduces the file formatting exactly).
2. Rebuild the `written` counts in `src/data/_manifest.json` from the actual files.
3. Sync Supabase:
   - new question → insert one row: `uid: uidFor('written', q.q)` (`src/lib/qid.js`),
     `module:'written'`, `type:'written'`, `payload:<whole item>`, `sort_order` = its array index.
   - answer-only edit → `node scripts/sync-written.mjs` (`--dry` first).
   - **question text changed** → the uid changes and would orphan the user's
     Important/Nailed/Weak flags. Migrate instead: update `questions.uid`, `.question`,
     `.payload` on the row matched by the OLD uid, then `user_progress.uid` old → new.
4. Bump `EXPECTED.written` in `scripts/seed.mjs` to the new total.

Display order inside a segment is `sort_order` **DESC** (highest first). To place a new
question *after* existing ones in a segment, insert it earlier in the array and renumber
that category's `sort_order` in Supabase so it still matches the array index.

**Deploy ordering:** content is served live from Supabase, decoupled from the Vercel
deploy. If a payload uses a `points[]` shape the deployed frontend can't render yet, the
page goes blank. Push the frontend change before (or with) the payload that needs it.

## Answer fields (rendered by `src/components/WrittenCardBody.jsx`, in this order)

`code` + `codeLang` → `image` → `summary[]` → `points[]` → `diagram` → `table{headers,rows}`
→ `mistakes[[wrong,right]]` → `mnemonic` → `extended{...}` (collapsible).

`points[]` items are strings, `{sub}` (indented child), `{code, codeLang, label}` or
`{diagram, label}` (standalone block right at that spot). `codeLang`: `c`, `cpp`, `java`, `sql`.

Top-level `segment` (+ optional `subsegment`) pins a question into its own labelled
section above the normal list.
