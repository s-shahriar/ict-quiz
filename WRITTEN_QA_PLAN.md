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

When you give me a question, I will auto-assign it to the right category.

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
      "q": "Question text in English (as given by user)",
      "tags": ["RAID", "storage"],
      "answer": {
        "summary": "One-liner Bengali summary (shown first, collapsed view)",
        "points": [
          "বিন্দু ১: ...",
          "বিন্দু ২: ..."
        ],
        "diagram": "ASCII diagram string (optional, null if none)",
        "table": [
          { "col1": "...", "col2": "..." }
        ],
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
- `diagram` is null if no visual is needed.
- `table` is empty array `[]` if no comparison is needed.

---

## 3. Answer Format Rules (how I will answer every question)

### Always
- ✅ Answer in **Bengali** (বাংলা)
- ✅ Use **bullet points** — not paragraphs
- ✅ Keep it **precise** — exam-ready, not textbook-heavy
- ✅ Add a **mnemonic** at the end of every answer
- ✅ Add **ASCII sketch/diagram** wherever it helps visualize (network topologies, OS layers, memory layout, RAID, etc.)
- ✅ Use **table** when a difference/comparison is asked

### When user says "আরও বুঝিয়ে দাও" / "explain further"
- ✅ Add `extended` block with related cases, equations, edge cases
- ✅ Include neighboring concepts the user likely doesn't know (e.g., RAID 4 when asked about RAID 5)

### Never
- ❌ Long paragraphs
- ❌ Repeating the question back
- ❌ Over-explaining what's already obvious from the question

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

## 7. Diagram / Sketch Guidelines (for my answers)

I will use ASCII art inline in the `diagram` field. Examples of what gets a diagram:

| Question type | Diagram |
|---|---|
| Network topology | ASCII nodes + connections |
| OSI / TCP-IP layers | Stacked box diagram |
| RAID layout | Drive grid showing parity |
| Memory layout (OS/micro) | Stack/heap/segment boxes |
| Tree / graph (DSA) | ASCII tree |
| Logic gates (Digital Logic) | Gate symbol in text |
| Process states (OS) | State machine arrows |
| ER Diagram (Database) | Entity-relationship boxes |

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

- [ ] Data structure finalized
- [ ] `src/data/written/` files created
- [ ] UI components built
- [ ] App.jsx wired up
- [ ] First batch of questions populated
