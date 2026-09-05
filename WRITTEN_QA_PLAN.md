# Written Q&A Feature — Plan

## Overview

A new section alongside Quiz/Study mode where **written exam questions** are answered in Bengali.
The goal: exam-ready, memorable, quick-to-revise answers that stick.

---

## 1. Categories (same as existing MCQ topics)

| Category ID | Display Name | Maps to existing topic |
|---|---|---|
| `computer_fundamental` | Computer Fundamentals | ✅ |
| `computer_network` | Computer Networks | ✅ |
| `operating_system` | Operating Systems | ✅ |
| `database` | Database Systems | ✅ |
| `digital_logic` | Digital Logic | ✅ |
| `dsa` | Data Structures & Algorithms | ✅ |
| `oop` | Object Oriented Programming | ✅ |
| `information_security` | Information Security | ✅ |
| `linux` | Linux | ✅ |
| `microprocessor` | Microprocessor | ✅ |
| `c_programming` | C Programming | ✅ |
| `software_engineering` | Software Engineering | ✅ |
| `server` | Server | ⭐ Written-only (no MCQ counterpart) |

When you give me a question, I will auto-assign it to the right category.

> **Note:** `server` is a Written-only category (it has no MCQ topic). It is registered
> via `WRITTEN_ONLY_TOPICS` in `src/data/written/index.js` so it shows in the Written
> module without creating an empty MCQ card.

---

## 2. Data Structure

Written Q&A lives in `src/data/written/` — one JSON per topic.

```
src/data/written/
  computer_network.json
  operating_system.json
  database.json
  ... (one per category)
```

### JSON schema for each file

```json
{
  "category": "computer_network",
  "questions": [
    {
      "id": "cn_001",
      "segment": "Program Output",
      "subsegment": "Pointer",
      "q": "Question text in English (as given by user)",
      "tags": ["RAID", "storage"],
      "answer": {
        "code": "int main() { ... }",
        "codeLang": "c",
        "summary": ["One-liner Bengali summary lines (shown first, collapsed view)"],
        "points": [
          "বিন্দু ১: ...",
          { "sub": "ইনডেন্টেড child point" },
          { "code": "for (...) { ... }", "codeLang": "c", "label": "Pattern ২" },
          { "diagram": "ASCII diagram for THIS section only", "label": "Diagram — Pattern ২" },
          "বিন্দু ২: ..."
        ],
        "diagram": "ASCII diagram string — only for a single-topic answer; see §7",
        "table": { "headers": ["...", "..."], "rows": [["...", "..."]] },
        "mistakes": [["ভুল ধারণা", "আসল কথা"]],
        "mnemonic": "মনে রাখার উপায়: ...",
        "extended": {
          "show": false,
          "title": "আরও জানো: RAID 4, RAID 10 equations",
          "points": ["..."],
          "diagram": null,
          "table": []
        }
      }
    }
  ]
}
```

- `extended` is only present when the user asks for further explanation.
- `diagram` is null/omitted if no visual is needed for that question as a whole.
- `table` is omitted if no comparison is needed.
- `segment` / `subsegment` are optional — only for a question that should be pinned above the normal numbered list under a heading (`segment`), optionally further grouped into a labeled sub-group (`subsegment`). Most questions have neither.
- A `points[]` item is normally a string or `{ "sub": "..." }`, but can also be `{ "code", "codeLang", "label" }` or `{ "diagram", "label" }` — these render as a standalone box right at that spot in the list instead of a bullet. Use them so a multi-topic answer shows each topic's snippet/diagram immediately after that topic's own points — see §3.1 and §7.

---

## 3. Answer Format Rules (how I will answer every question)

### Always
- ✅ Answer in **Bengali** (বাংলা)
- ✅ Use **bullet points** — not paragraphs
- ✅ Keep it **precise** — exam-ready, not textbook-heavy
- ✅ Add a **mnemonic** at the end of every answer
- ✅ Add a **rich ASCII visualization** in the `diagram` field — not a bare sketch. **Draw the actual thing** (a tower box, a rack with U-slots, a blade chassis), **label every part** with `←` callouts, and end multi-item topics with an **at-a-glance comparison strip**. See §7 for the full standard. The goal: understand it in one glance.
- ✅ Use **table** when a difference/comparison is asked

### When user says "আরও বুঝিয়ে দাও" / "explain further"
- ✅ Add `extended` block with related cases, equations, edge cases
- ✅ Include neighboring concepts the user likely doesn't know (e.g., RAID 4 when asked about RAID 5)

### Never
- ❌ Long paragraphs
- ❌ Repeating the question back
- ❌ Over-explaining what's already obvious from the question

---

## 3.1 One idea per line — bad vs. good (real example)

Confirmed by direct user feedback (2026-09-02, on the ARQ question): a `{sub}` that
crams multiple sentences together reads as **"হিজিবিজি"** (a jumbled mess) even when
every fact in it is correct. **This is the default for every written question now,
not a special case for long answers.**

**❌ BAD — multiple ideas crammed into one `{sub}`:**
```json
{ "sub": "Sender একটি frame পাঠিয়ে timer শুরু করে এবং ACK না আসা পর্যন্ত পরের frame পাঠায় না। Sequence number মাত্র ১ bit (0/1) — একসাথে একটাই frame in-flight থাকে বলে duplicate বোঝাতে এটুকুই যথেষ্ট।" },
{ "sub": "সম্ভাব্য অবস্থা: Frame হারালে — timeout শেষে sender একই seq দিয়ে আবার পাঠায়; ACK হারালে — sender timeout-এ আবার পাঠায়, receiver seq দেখে duplicate বুঝে শুধু ACK আবার পাঠায়; ACK দেরি করলে — timeout ইতিমধ্যে হয়ে sender আবার পাঠিয়ে দেয়, receiver duplicate পায়।" }
```
Two `{sub}` items, but the second one alone buries **three separate scenarios**
(frame lost / ACK lost / ACK delayed) in one run-on sentence — the reader has to
mentally re-split it before they can even start studying it.

**✅ GOOD — one clause, one `{sub}`, one scenario each:**
```json
{ "sub": "Sender একটি frame পাঠিয়ে timer শুরু করে।" },
{ "sub": "ACK না আসা পর্যন্ত সে পরের frame পাঠায় না — একসাথে সর্বোচ্চ ১টা frame in-flight থাকে।" },
{ "sub": "Sequence number মাত্র ১ bit (0/1) — একসাথে একটাই frame থাকে বলে duplicate বোঝাতে এটুকুই যথেষ্ট।" },
{ "sub": "Frame হারালে: timeout শেষে sender একই sequence দিয়ে আবার পাঠায়।" },
{ "sub": "ACK হারালে: sender timeout-এ আবার পাঠায়; receiver sequence দেখে duplicate বুঝে শুধু ACK আবার পাঠায় (data বাদ দিয়ে)।" },
{ "sub": "ACK দেরি করলে: timeout ইতিমধ্যে হয়ে sender আবার পাঠিয়ে দেয়; receiver duplicate পায়।" }
```
Same information, six short lines instead of two dense ones. Each line answers
exactly one question ("what does the sender do", "what happens if X"). A semicolon
inside a `{sub}` is still fine when it's genuinely one thought with a short aside
(`sender timeout-এ আবার পাঠায়; receiver ... বাদ দিয়ে`) — the rule is *one scenario/idea
per line*, not *zero punctuation*.

**How to tell if a `{sub}` needs splitting:** if it names more than one condition
("Frame হারালে... ACK হারালে... ACK দেরি করলে...") or more than one action joined by
"এবং" / "তারপর" / a semicolon-separated list of unrelated facts, split it — one line
per condition/action.

---

## 4. UI — New Route / Screen Flow

### Where it fits in the app

```
Home Screen
├── [existing] Topic Cards (MCQ)          ← unchanged
└── [NEW] "Written Q&A" button            ← new entry point
      │
      ▼
Written Home Screen
  - Shows categories as cards (same icons/colors as existing topics)
  - Badge showing question count per category
      │
      ▼
Written Category Screen  (e.g., "Computer Networks")
  - Question list on left / sidebar
  - Answer panel on right (desktop) / below (mobile)
      │
      ▼
Written Answer View  (per question)
  ┌─────────────────────────────────────┐
  │  Q: [question text]                 │
  │  ─────────────────────────────────  │
  │  📋 Summary (Bengali, 1 line)       │
  │                                     │
  │  • বিন্দু ১                         │
  │  • বিন্দু ২                         │
  │  • বিন্দু ৩                         │
  │                                     │
  │  [ASCII Diagram if present]         │
  │                                     │
  │  [Table if comparison question]     │
  │                                     │
  │  🧠 মনে রাখো: [mnemonic]           │
  │                                     │
  │  [+ আরও বিস্তারিত]  ← toggle       │
  │    (extended block, collapsible)    │
  └─────────────────────────────────────┘
```

### Key UI interactions
- **Accordion / collapsible** per question in the list view
- **"আরও বিস্তারিত" toggle** expands the extended block inline
- **Search bar** to find questions across all written categories
- **Category filter chips** at the top
- **Print / copy** button per question (for notes)
- Keyboard nav: `j/k` to move between questions, `e` to expand extended

---

## 5. Component Plan

```
src/components/written/
  WrittenHome.jsx          ← category selection grid
  WrittenCategoryPage.jsx  ← question list + answer panel
  WrittenAnswerCard.jsx    ← single Q&A card with expand/collapse
  WrittenDiagram.jsx       ← renders ASCII diagram in monospace box
  WrittenTable.jsx         ← renders comparison table
  WrittenMnemonic.jsx      ← styled mnemonic chip
```

`src/data/written/index.js` — aggregates all written JSON files (same pattern as `src/data/index.js`).

---

## 6. App.jsx changes

Add two new screens to the state machine:

```
'home' → 'written_home' → 'written_category'
```

Add a "Written Q&A" button on the Home Screen (distinct style from topic cards).

---

## 7. Visualization Standard (the heart of every answer)

Diagrams are **visual-first**, not decorative. A good `diagram` lets you grasp the concept in one glance — so I draw the *real object*, label its parts, and finish with a comparison strip. ASCII art goes inline in the `diagram` field (rendered in a monospace `<pre>` box).

### The 4 rules every visualization follows

1. **Draw the actual thing, not an abstraction.** A tower server looks like a standing box with drive bays and fans; a rack looks like a cabinet with stacked U-slots; a blade chassis looks like thin blades in a shared frame. Don't draw three identical rectangles.
2. **Label every meaningful part** with `←` callouts (e.g. `← cooling fans`, `← 1U server`, `← shared backplane`). Mix Bengali + English labels freely.
3. **End multi-item topics with an at-a-glance strip** — a tiny side-by-side of all items plus the one or two axes that matter (`Density: Tower < Rack < Blade`).
4. **Keep it readable on a phone.** Stack big illustrations vertically (one per numbered step) rather than side-by-side when each is wide; reserve side-by-side for the small summary strip. Use box-drawing chars (`┌ ─ ┐ │ ╔ ═ ╟ ▌ ▤ ◍ ●`) for texture.

### Worked example — the standard to match (`server_003`)

```
1) TOWER SERVER — দাঁড়ানো PC-এর মতো, standalone
   ┌───────────────┐
   │ ● POWERCERT   │  ← front panel
   │ │ ▤ ▤ ▤ ▤ ▤ │ │  ← HDD bays
   │ │  ◍   ◍    │ │  ← cooling fans
   └───────────────┘
   floor-standing │ 1 box = 1 server

2) RACK SERVER — flat unit, 19" rack-এ stack, U-তে মাপা
   ╔═══════════════╗
   ║▐ ●● ▦▦▦▦ [==]▐║ 1U   ← প্রতি drawer = 1 server
   ╟───────────────╢
   ║▐ ●● ▦▦▦▦▦ [=]▐║ 2U
   ╚═══════════════╝

3) BLADE SERVER — পাতলা blade, shared chassis-এ গাঁথা
   ╔═══════════════════╗
   ║ │▌│▌│▌│▌│▌│▌│▌│  ║  ← প্রতি ▌ = 1 blade = 1 server
   ╟───────────────────╢
   ║ ▣ SHARED power/cool║  ← এক backplane সব blade-কে দেয়
   ╚═══════════════════╝

────────────────────────────────
  Tower      Rack       Blade      ← at-a-glance strip
  ┌──┐      ╔════╗     ╔═══════╗
  │  │      ║════║     ║║║║║║║║║
  └──┘      ╚════╝     ╚═══════╝
  Density: Tower < Rack < Blade
```

### Per-topic visualization ideas

| Question type | Visualization |
|---|---|
| Server form factors / hardware | Draw each chassis distinctly + density strip |
| VM vs Container | Side-by-side layered stacks (App/OS/Hypervisor vs App/Engine/kernel) |
| Network topology | ASCII nodes + labelled connections |
| OSI / TCP-IP layers | Stacked box diagram, each layer labelled |
| RAID layout | Drive grid showing data + parity blocks |
| Memory layout (OS/micro) | Stack/heap/segment boxes with addresses |
| Tree / graph (DSA) | ASCII tree with node values |
| Logic gates (Digital Logic) | Gate symbols + truth-value flow |
| Process states (OS) | State machine with labelled arrows |
| ER Diagram (Database) | Entity boxes + relationship lines |

> If a diagram isn't clear in one glance, I redraw it — just say **"sketch টা বুঝলাম না"**.

### 7.1 Multi-topic answers: one diagram per topic, placed inline — never combined, never side-by-side

Confirmed by two real incidents on the ARQ question (Stop-and-Wait / Sliding Window /
Go-Back-N / Selective Repeat), both from the same root mistake: one combined diagram
covering every topic, built with topics laid out **side by side** on shared lines.

**❌ BAD — side-by-side Bengali-labeled columns, all topics dumped in one combined `diagram` at the end of the answer:**
```
  স্বাভাবিক আদান-প্রদান          Frame হারালে                ACK হারালে                  ACK দেরি করলে
  Sender     Receiver         Sender     Receiver          Sender     Receiver          Sender     Receiver
    │──seq0───►│                │──seq0──X │                │──seq0───►│                │──seq0───►│
    │◄──ACK0───│                │(timeout) │                │  X◄─ACK0─│                │◄─ACK0(দেরি)..│
```
This has two separate problems, and either one alone is enough to reject it:
1. **It visibly breaks in the browser.** Bengali glyphs do NOT render at a fixed
   monospace cell width (the diagram font, JetBrains Mono, has no Bengali glyphs, so
   the browser silently substitutes a different font for that text). Any layout that
   space-pads Bengali-labeled columns to line up next to *another* Bengali-labeled
   column WILL drift out of alignment on screen, even though the raw text looks
   perfectly aligned in the editor. This is not a style nitpick — it rendered as a
   genuinely broken/garbled diagram in production.
2. **Even if it rendered fine, it reads badly.** The reader has to jump back and
   forth between the diagram (at the very end) and the topic's own explanation
   (much earlier), instead of seeing the diagram right where the topic is discussed.

**✅ GOOD — one topic's diagram placed immediately after that topic's own points, each one stacked as a simple 2-column sequence (no side-by-side columns at all):**
```json
"points": [
  "Stop-and-Wait ARQ — নীতি: (Data+ACK) + timeout timer + sequence number",
  { "sub": "Sender একটি frame পাঠিয়ে timer শুরু করে।" },
  { "sub": "ACK না আসা পর্যন্ত সে পরের frame পাঠায় না — একসাথে সর্বোচ্চ ১টা frame in-flight থাকে।" },
  { "sub": "Frame হারালে: timeout শেষে sender একই sequence দিয়ে আবার পাঠায়।" },
  {
    "label": "Diagram — Stop-and-Wait ARQ",
    "diagram": "[১] স্বাভাবিক আদান-প্রদান\n  Sender                Receiver\n    │──seq0───────────►│\n    │◄──────────ACK0───│\n\n[২] Frame হারালে\n  Sender                Receiver\n    │──seq0────X        │   (frame হারিয়ে গেল)\n    │ (timeout)          │\n    │──seq0───────────►│   (আবার পাঠানো)\n    │◄──────────ACK0───│"
  },
  "Go-Back-N ARQ",
  { "sub": "sender window size N পর্যন্ত frame টানা পাঠাতে পারে।" },
  { "label": "Diagram — Go-Back-N ARQ", "diagram": "  Sender              Receiver\n    │──0───────────────►│\n    │──1───────────────►│\n    │──2────X            │   (হারালো)\n    │◄──────────ACK=1───│   (cumulative: শুধু '1 পর্যন্ত ঠিক আছে')" }
]
```
Each scenario/topic is its **own fully vertical block** (`Sender` column, `Receiver`
column, nothing else sharing those lines) — no two Bengali-labeled sections ever need
to line up against each other, so there's nothing for the font-metric mismatch to
break. And the diagram sits exactly where the reader is already looking.

**The rule, stated generally:** only pure-ASCII/numeric content (`│ ─ ► ◄ X`, digits,
Latin words) may participate in strict multi-column alignment. Bengali text is always
a trailing annotation *after* an already-aligned ASCII structure, never something
another column's alignment depends on. If a diagram idea needs two things side by
side, keep both sides to ASCII/numbers only (e.g. the sliding-window box diagram,
which is safe because `┌───┬───┬───┬───┐` and digits don't need font-metric
cooperation from Bengali glyphs) — anything with Bengali labels goes fully vertical.

### 7.2 The second alignment trap: box-drawing glyphs are NOT the same width as ASCII

Found 2026-09-05 while redrawing the ARQ diagrams. §7.1 says "only pure-ASCII
content may participate in strict multi-column alignment" — that turned out to be
necessary but **not sufficient**. A diagram can be 100% ASCII + box-drawing, with
every line character-counted to the exact same length, and *still* render with a
wandering right-hand edge.

**Why:** the loaded JetBrains Mono subset has no glyphs for U+2500–257F (`─ │ ┌ ┐
└ ┘ ┬ ┴ ┼`), the arrows (`► ◄`), or the block chars (`▇`). The browser silently
pulls those from a fallback face whose advance width is ~0.17px narrower than
JetBrains Mono's ASCII (7.83px vs 8.00px at the diagram's font size). So a line
made mostly of `─` and a line made mostly of spaces end up different pixel widths
even at identical character counts. Measured on the real page:

```
    │───── Frame 1 ────────────────►│      right bar at x = 599.5
    │  (timeout: Frame 3)           │      right bar at x = 601.9   ← 2.4px drift
```

**The fix is in CSS, not in the diagram text.** `.written-diagram-pre` no longer
uses JetBrains Mono; it uses a stack (`'DejaVu Sans Mono', 'Liberation Mono',
'Noto Sans Mono', ui-monospace, monospace`) whose first available face supplies
ASCII *and* box-drawing from the same font, so every cell is one width again.
Code blocks keep JetBrains Mono — code is pure ASCII and never mixes.

**What this means when writing a diagram:** you may now mix box-drawing and ASCII
freely; §7.1's Bengali rule still stands in full, because that one is about font
*substitution for a script the mono face doesn't cover at all*, which no font
stack fixes. Bengali stays a trailing annotation after the last aligned glyph.

**How to verify a new diagram** rather than trusting the character count: build it
in a script that asserts (a) each line's bar column index, and (b) that nothing
but ASCII and box-drawing sits between the bars. Then measure the rendered page —
`document.createRange()` over the `<pre>`'s text node gives the true pixel x of
each bar, and every sequence row should report a single distinct x.

---

## 8. Mnemonic Strategy

Every answer ends with a Bengali mnemonic using one of:

- **Acronym** — first letters of key points spell a word
- **Story/analogy** — relatable Bengali comparison ("ভাবো যেন বাসার গেট...")
- **Rhyme/rhythm** — short Bengali rhyme
- **Visual hook** — tie the concept to a diagram element

---

## 9. Implementation Order

1. **Data layer** — create `src/data/written/` structure and index
2. **WrittenHome.jsx** — category grid
3. **WrittenCategoryPage.jsx** — question list + answer panel
4. **WrittenAnswerCard.jsx** — the core card with all blocks
5. **WrittenDiagram / WrittenTable / WrittenMnemonic** — sub-components
6. **App.jsx** — wire up new screens
7. **HomeScreen.jsx** — add "Written Q&A" entry button
8. **Populate data** — as user provides questions, I answer and add to JSON

---

## 10. Workflow (how we will work together)

1. **You give me a question** (English is fine)
2. **I assign it to a category** and confirm
3. **I write the Bengali answer** in the format above
4. **I add it to the correct JSON file**
5. If you say **"আরও বুঝিয়ে দাও"** → I extend the answer with related concepts
6. If you say **"sketch টা বুঝলাম না"** → I improve the ASCII diagram

---

## Status

- [x] Data structure finalized
- [x] `src/data/written/` files created
- [x] UI components built
- [x] App.jsx wired up
- [x] First batch of questions populated
