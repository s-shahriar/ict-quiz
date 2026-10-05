# ict-quiz — working notes for Claude

## ⚠️ SINGLE-SOURCE RULE — never skip (web app AND Slate must both see every addition)

Slate (the Android app, `~/Projects/Self/Quiz/slate`) and this web app read the **same Supabase project**. Any new or
edited content — a question, written answer, equation, practice drill, viva/extra item, image, topic — must be saved
**in Supabase**, so it shows up in both without being re-entered. Content that lives only in a repo file, a JS/JSON bundle
or Slate's `assets/` is invisible to the other app and is a bug. Do this **every time**, and tell the user it is done:

| Content | Where it must end up | How |
|---|---|---|
| MCQ | `questions` (`module:'mcq'`) | insert straight into the DB (no `src/data/*.json` step) |
| Written / Extra / Viva | `questions` (`module` = written/extra/viva) | edit the JSON, then the written-Q&A steps below (`sync-written.mjs`) |
| Equation data, Practice (Linux/SQL) | `content_blobs` (`equation`, `practice`) | edit `src/data/{equation,practice}`, then `node scripts/sync-static.mjs` |
| Equation page for Slate | `content_blobs` (`web/equation_<slug>`) | then `node ~/Projects/Self/Quiz/slate/tools/prerender/build.mjs` |
| Written images | `public/written-images` (served by Vercel; Slate downloads by URL) | deploy the web app |

Finish every content change with a check: query the DB (or reload the web app) and confirm the new row is **live**, and for
equations confirm the prerender publish ran. A repo-only edit is not done. Known exceptions (still hardcoded in the web
bundle AND Slate until moved into the DB): topic names/colours/icons and `src/data/_manifest.json` counts — change both when
you add a category.

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
     `.payload` on the row matched by the OLD uid, then `user_progress.uid` and
     `user_highlights.uid` old → new.
4. Bump `EXPECTED.written` in `scripts/seed.mjs` to the new total.

**Highlights after an edit:** losing a highlight because its text changed is fine, but
dead highlight rows must not pile up in `user_highlights` (the user's rule). Any content
edit → `node scripts/prune-highlights.mjs` deletes highlights whose text can no longer be
placed. `sync-written.mjs` already runs it after every sync (and `--dry` previews it);
run it by hand after editing equations or MCQs.

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

## Adding or editing an equation (Equation tab)

**Read `EQUATION_PLAN.md` first** — it is the contract, and the user asked that it be
followed in every chat. The short version:

- The equation **data** (`src/data/equation/<slug>.js`) is the authoring source, and the app reads it from Supabase
  (`content_blobs`, kind `equation`). After editing run `node scripts/sync-static.mjs` (`--dry` first), then
  `node ~/Projects/Self/Quiz/slate/tools/prerender/build.mjs` so Slate gets the rendered page (`web/equation_<slug>`).
  The SVG **diagrams** (`src/components/equation/diagrams/`) are frontend code and go live with the Vercel deploy;
  a new `diagram` key must be deployed before its data is synced (same ordering rule as written payloads).
  Practice (`src/data/practice/*.json`) works the same way: edit, then `node scripts/sync-static.mjs`.
- Equations go in **groups**, one diagram per group. The diagram is a picture of the real
  thing with **every term of every equation labelled on it, in the formula's own words**
  (the coverage rule, §5.1) — and it never prints the formula itself.
- If two equations differ only by unit or form, the diagram shows both forms on the same
  object and both notes use the same numeric example.
- Formulas use the user's own words (`\text{Window size}`); a unit that matters goes
  inside the formula. Notes are Bengali with technical terms in English.
- No worked-example (প্রশ্ন → ধাপ → উত্তর) blocks — the user removed them all. Put one
  set of concrete numbers in the diagram instead, so a value can be followed through it.
- Report anything unclear in the user's notes and every interpretation or addition.
- Renaming a group `id` or an equation `name` drops saved highlights on it (§6); after any
  equation edit run `node scripts/prune-highlights.mjs` so the dead rows are deleted.
- Check each new group in a real browser (dark + light, desktop + phone) before done.
