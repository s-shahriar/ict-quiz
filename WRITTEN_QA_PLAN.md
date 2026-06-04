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

### Server category (`server.json`)
- [x] `server_001` — Differences between VM and Container
- [x] `server_002` — Pros and Cons of VM and Container
- [x] `server_003` — Tower vs Rack vs Blade Server *(rich visualization — the standard reference)*
- [x] `server_004` — ECC memory: what, why needed, where not needed
- [x] `server_005` — RAID controller vs HBA: difference + which is better for what
- [x] `server_006` — KVM vs VMware: difference + which is better for what
- [x] `server_007` — Kubernetes: what it is + architecture (control plane / worker nodes)
- [x] `server_008` — Docker vs Kubernetes: difference + how they relate
- [x] `server_009` — SELinux: modes (enforcing/permissive/disabled) + configuration
- [x] `server_010` — NAS vs SAN vs DAS: difference + which is used for what
- [x] `server_011` — Data center networking: topologies (three-tier vs spine-leaf) + key tech
- [x] `server_012` — SDN: what it is, why needed, architecture (N/S API), use cases
- [x] `server_013` — Load Balancer: static vs dynamic algorithms + why needed
- [x] `server_014` — Kubernetes vs OpenShift: what each is + differences
- [x] `server_015` — Infrastructure as Code (IaC): what it is + why needed
- [x] `server_016` — ELK Stack: components (Elasticsearch/Logstash/Kibana/Beats) + flow
- [x] `server_017` — Microservices vs Monolithic: what each is + differences
- [x] `server_018` — RTO, RPO, Failover: disaster recovery concepts
- [x] `server_019` — Spine-Leaf architecture (placed before server_011 in display order)
- [x] `server_020` — Snapshots vs Backup vs Replicas: what each is + differences
- [x] `server_021` — VM Lifecycle: states + operations (snapshot/migrate/clone)
- [x] `server_022` — Storage protocols: iSCSI, Fibre Channel, NFS, SMB/CIFS (block vs file)
- [x] `server_023` — CI/CD & DevOps pipeline: Code→Build→Test→Package→Deploy→Monitor
- [x] `server_025` — Live Migration (basic idea) + High Availability in virtualization
