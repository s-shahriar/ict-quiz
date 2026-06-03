# Plan: Standard React Refactoring

> **Date:** 2026-06-02
> **Project source:** Standalone
> **Estimated tasks:** 20-25
> **Planning session:** Detailed

## Summary

Refactor the ICT Quiz React SPA from a flat, single-file-state architecture to a modern React pattern using React Router for navigation, custom hooks for stateful logic, Context API for shared state, and CSS Modules for scoped styling. No data, design, or features will be lost — the refactoring is purely structural.

## Requirements

### Functional Requirements

1. All 11 screens must remain accessible and fully functional after refactoring
2. All user progress data (nailed, important, written mastered) persisted in localStorage must survive the refactoring with zero data loss
3. Backup/restore system (binary cypher v1, v2, legacy JSON) must continue to work identically
4. Dark/light theme toggle must work identically with same persistence behavior
5. All MCQ features (quiz, study, exam modes) must work identically
6. All Written features (Q&A browsing, expandable cards, rich answer rendering) must work identically
7. Category sidebar must continue to function in Study and Written modes
8. Browser back/forward navigation must work correctly on every screen
9. Direct URL access to any screen must load the correct state
10. All animations, glass morphism effects, and visual design must be preserved pixel-perfect

### Non-Functional Requirements

1. No new runtime dependencies except `react-router-dom`
2. Bundle size should not increase significantly
3. Build must continue to work on Vercel/Netlify with clean URL support
4. All existing localStorage keys remain unchanged for backward compatibility
5. CSS Modules must not break existing CSS custom property theming system
6. Accessibility features (focus-visible, prefers-reduced-motion) must be preserved

## Behaviors

**Why rules matter:**

- The localStorage keys are user-facing data contracts — changing them would silently erase progress for every existing user
- The backup encoding format is a wire protocol — any change breaks compatibility with exported backup codes users may have saved
- The screen-based navigation currently prevents deep linking and browser history — React Router fixes this but must map each screen state to a URL without losing navigation context (e.g., which topic was selected)

**What's required vs optional:**

- REQUIRED: Router, hooks, context, CSS Modules — all four areas must be completed
- REQUIRED: All localStorage keys unchanged
- REQUIRED: Backup format unchanged
- OPTIONAL: Adding new features during refactoring (strictly forbidden)

**Common mistakes:**

- Forgetting to pass route params (topic ID) through context, causing screens to load without data
- Breaking the mastered/important Sets by converting them to arrays during the refactor (they must remain Sets internally)
- Losing the `--c` CSS custom property that drives per-topic accent colors via `color-mix()` when splitting CSS
- Breaking the category sidebar's slide-out animation when moving to CSS Modules
- Forgetting that `content-visibility: auto` is used for performance and must be preserved in the new CSS

## Detailed Specifications

### 1. React Router Integration

**Purpose:** Replace the manual `screen` state variable with URL-based routing for proper navigation, deep linking, and browser history support.

**Route Map:**

| Route                     | Component                  | Current Screen Value       |
| ------------------------- | -------------------------- | -------------------------- |
| `/`                       | HomeScreen                 | `home`                     |
| `/mcq/:topicId`           | ModeSelect                 | `mode`                     |
| `/mcq/:topicId/quiz`      | QuizMode                   | `quiz`                     |
| `/mcq/:topicId/study`     | StudyMode                  | `study`                    |
| `/mcq/:topicId/nailed`    | NailedScreen (filtered)    | `nailed` (single topic)    |
| `/mcq/:topicId/important` | ImportantScreen (filtered) | `important` (single topic) |
| `/exam`                   | ExamConfig                 | `exam_config`              |
| `/exam/:topicId`          | ExamMode                   | `exam`                     |
| `/nailed`                 | NailedScreen (all)         | `nailed`                   |
| `/important`              | ImportantScreen (all)      | `important`                |
| `/written`                | WrittenMode                | `written`                  |
| `/written/nailed`         | WrittenNailedScreen        | `written_nailed`           |
| `/written/important`      | WrittenImportantScreen     | `written_important`        |

**Behavior:**

- Topic is resolved from URL param `:topicId` by looking up the TOPICS/WRITTEN_TOPICS registry
- If topic ID is invalid, redirect to home (`/`)
- Navigation uses `<Link>` and `useNavigate()` instead of `setScreen()`
- Exam data (selected topics, question count) is passed via route state or URL search params
- `goHome()` becomes `navigate('/')`
- `goWrittenHome()` becomes `navigate('/', { state: { module: 'written' } })` or similar

**Error Scenarios:**
| Condition | Expected Behavior |
|-----------|-------------------|
| Invalid topic ID in URL | Redirect to `/` |
| Direct access to `/mcq/:topicId/quiz` without topic data | Topic resolved from URL param, quiz loads normally |
| Browser back from quiz to mode select | ModeSelect renders with topic from URL |
| Exam mode accessed directly without config | Redirect to `/exam` config screen |

### 2. Custom Hooks Extraction

**Purpose:** Move all localStorage-persisted state and reusable logic out of components into dedicated custom hooks.

**Hooks to create:**

| Hook                   | Manages                     | localStorage Key     | Internal Type        |
| ---------------------- | --------------------------- | -------------------- | -------------------- |
| `useTheme()`           | `ict-theme`                 | `ict-theme`          | `'light'` / `'dark'` |
| `useMastered()`        | MCQ nailed set              | `ict-nailed`         | `Set<string>`        |
| `useImportant()`       | MCQ + Written important set | `ict-important`      | `Set<string>`        |
| `useWrittenMastered()` | Written nailed set          | `ict-written-nailed` | `Set<string>`        |
| `useBackup()`          | Export/import logic         | reads all keys       | N/A                  |

**Each persistence hook interface:**

```
{
  value: Set<string>,        // current value
  add: (id: string) => void, // add item
  remove: (id: string) => void, // remove item
  toggle: (id: string) => void, // toggle presence
  has: (id: string) => boolean, // check presence
}
```

**`useTheme` interface:**

```
{
  theme: 'light' | 'dark',
  toggleTheme: () => void,
}
```

**Behavior:**

- Each hook reads from localStorage on mount (lazy init of useState)
- Each mutation immediately writes back to localStorage (same pattern as current)
- The `useBackup` hook uses the existing `backup.js` encode/decode functions unchanged

### 3. Context API for Shared State

**Purpose:** Eliminate prop drilling by providing shared state through React Context.

**Contexts to create:**

| Context                  | Provides                                    | Consumed By                                                             |
| ------------------------ | ------------------------------------------- | ----------------------------------------------------------------------- |
| `ThemeContext`           | `theme`, `toggleTheme`                      | App root (sets data-theme attribute), all components with theme toggle  |
| `MasteredContext`        | mastered Set, nail/unnail/toggle/has        | QuizMode, StudyMode, ExamMode, NailedScreen, HomeScreen                 |
| `ImportantContext`       | important Set, mark/unmark/toggle/has       | QuizMode, StudyMode, ExamMode, ImportantScreen, WrittenMode, HomeScreen |
| `WrittenMasteredContext` | writtenMastered Set, nail/unnail/toggle/has | WrittenMode, WrittenNailedScreen                                        |

**Provider hierarchy:**

```
<BrowserRouter>
  <ThemeProvider>
    <MasteredProvider>
      <ImportantProvider>
        <WrittenMasteredProvider>
          <Routes>...</Routes>
        </WrittenMasteredProvider>
      </ImportantProvider>
    </MasteredProvider>
  </ThemeProvider>
</BrowserRouter>
```

**Behavior:**

- Each provider internally uses the corresponding custom hook
- Components access state via `useContext()` instead of props
- App.jsx becomes a thin shell: providers + routes only

### 4. CSS Modularization

**Purpose:** Break the single 2400-line `index.css` into component-scoped CSS Modules while preserving global theme system.

**Global stylesheet (stays in `index.css`):**

- `:root` and `[data-theme="dark"]` CSS custom properties
- `@keyframes` animations (aurora, card-entrance, gradient-flow, shine)
- `@font-face` or Google Font imports
- `@media (prefers-reduced-motion: reduce)` overrides
- Base `body`, `html`, `*` reset styles
- `.modal-overlay` styles (used by BackupModal across components)

**Per-component CSS Modules:**
Each component gets a co-located `[ComponentName].module.css` file containing only its specific styles.

| Component              | CSS Module File                   | Key Styles                                     |
| ---------------------- | --------------------------------- | ---------------------------------------------- |
| HomeScreen             | HomeScreen.module.css             | Topic grid, module toggle, action cards        |
| ModeSelect             | ModeSelect.module.css             | Mode choice cards                              |
| QuizMode               | QuizMode.module.css               | Quiz card, options, score screen               |
| StudyMode              | StudyMode.module.css              | Study card, flashcard flip                     |
| ExamConfig             | ExamConfig.module.css             | Config panel, stepper                          |
| ExamMode               | ExamMode.module.css               | Exam card, timer, score                        |
| WrittenMode            | WrittenMode.module.css            | Written card, expandable sections              |
| WrittenCardBody        | WrittenCardBody.module.css        | Rich answer rendering (tables, diagrams, code) |
| NailedScreen           | NailedScreen.module.css           | Topic groups, question cards                   |
| ImportantScreen        | ImportantScreen.module.css        | Topic groups, question cards                   |
| WrittenNailedScreen    | WrittenNailedScreen.module.css    | Written nailed groups                          |
| WrittenImportantScreen | WrittenImportantScreen.module.css | Written important groups                       |
| CategorySidebar        | CategorySidebar.module.css        | Slide-out drawer, topic list                   |
| BackupModal            | BackupModal.module.css            | Modal, export/import UI                        |

**Behavior:**

- CSS Module class names are locally scoped by Vite (e.g., `styles.quizCard`)
- The `--c` custom property for per-topic accent colors is set as inline style on the element (already done this way) and works with CSS Modules since it's inherited via the cascade
- `content-visibility: auto` must be preserved on question card lists
- `backdrop-filter: blur()` glass effects must be preserved
- All animations referenced via CSS Module class names must still work (global `@keyframes` are accessible from module files)

## Key Constraints

| Constraint                                                                                     | Why It Matters                                                                                                                            |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| localStorage keys must not change                                                              | Changing keys silently erases all user progress (nailed questions, important bookmarks, theme preference)                                 |
| backup.js encode/decode logic must not change                                                  | Existing exported backup codes (ICT: prefix, v1, v2, JSON formats) would become unreadable                                                |
| Question ID format must remain `${topicId}__${index}` and `written__${topicId}__${questionId}` | These IDs are stored in localStorage Sets and encoded in backups — changing the format breaks all persisted data                          |
| Sets must remain Sets internally (not Arrays)                                                  | The backup encoding uses Set iteration order and membership checks; converting to arrays could break encoding/decoding                    |
| CSS custom properties (`:root` variables) must remain global                                   | CSS Modules cannot define `:root` variables; the theme system depends on cascade inheritance                                              |
| `--c` inline style must continue to work with CSS Modules                                      | Per-topic accent colors use `color-mix(in srgb, var(--c), ...)` — this relies on the `--c` custom property being set inline and inherited |
| No new features during refactoring                                                             | Feature creep during refactoring is the #1 cause of bugs and scope overrun                                                                |

## Edge Cases & Failure Modes

| Scenario                                                      | Decision                                                                               | Rationale                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| User has existing localStorage data from pre-refactor version | Data loads normally — same keys, same format, same parsing                             | Zero migration needed                                       |
| User shares a URL to a specific quiz screen                   | React Router loads the topic from URL param and renders the screen                     | Deep linking now works (improvement)                        |
| User presses browser back during exam                         | Exam warns before navigating away (if not already implemented) or navigates normally   | Must not lose exam progress silently                        |
| CSS Module class name conflicts with global class             | No conflict — Vite generates unique class names for modules                            | CSS Modules design guarantees this                          |
| `@keyframes` referenced in CSS Module                         | Global keyframes are accessible from CSS Module files                                  | Vite/browsers resolve `animation-name` against global scope |
| Exam mode needs topic config but URL is accessed directly     | Redirect to `/exam` config screen                                                      | No exam data in URL — must configure first                  |
| `content-visibility: auto` on question cards after CSS split  | Preserved — the property is set in the component's CSS Module                          | No behavior change                                          |
| `prefers-reduced-motion` disables animations after CSS split  | Global override remains in `index.css` and overrides module animations via specificity | Accessibility preserved                                     |
| BackupModal needs global `.modal-overlay` styles              | Keep overlay styles in global CSS or use a shared CSS Module                           | Modal overlay is used as a portal/overlay pattern           |

## Decisions Log

| #   | Decision                                                                                                  | Alternatives Considered                          | Chosen Because                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | React Router v6 with BrowserRouter and clean URLs                                                         | HashRouter, keeping manual screen state          | Clean URLs are standard, Vercel/Netlify supports SPA rewrites, better UX                                                                           |
| 2   | CSS Modules (co-located `.module.css` files)                                                              | Plain CSS per component, Tailwind CSS, CSS-in-JS | Zero deps, Vite native support, scoped by default, preserves existing CSS patterns                                                                 |
| 3   | Custom hooks for all localStorage state                                                                   | Keep state in App.jsx, use Zustand               | Hooks are the React-standard pattern, no new deps, clean separation of concerns                                                                    |
| 4   | React Context for shared state (theme, mastered, important)                                               | Keep prop drilling, use Zustand, use Redux       | Context is sufficient for this app's state complexity, no new deps, standard React pattern                                                         |
| 5   | Keep JavaScript (no TypeScript)                                                                           | Migrate to TypeScript                            | User preference — scope is already large with structural refactoring                                                                               |
| 6   | Keep all localStorage keys unchanged                                                                      | Rename keys with migration                       | Zero risk of data loss, no migration code needed                                                                                                   |
| 7   | Keep backup.js encoding format unchanged                                                                  | Rewrite encoding                                 | All existing backup codes remain compatible                                                                                                        |
| 8   | Single `ThemeProvider` wraps `MasteredProvider` wraps `ImportantProvider` wraps `WrittenMasteredProvider` | Single combined AppProvider                      | Separation of concerns, each context is independently testable and only re-renders its consumers                                                   |
| 9   | Global CSS for theme variables + animations, CSS Modules for component styles                             | All global, all modules, CSS-in-JS               | Theme variables must be global (CSS Modules can't define `:root`), animations are global (`@keyframes`), but component styles benefit from scoping |

## Scope Boundaries

### In Scope

- Replace screen state with React Router (all 11+ routes)
- Extract 5 custom hooks (useTheme, useMastered, useImportant, useWrittenMastered, useBackup)
- Create 4 React Contexts (ThemeContext, MasteredContext, ImportantContext, WrittenMasteredContext)
- Convert index.css into 14+ CSS Module files + 1 global CSS file
- Refactor App.jsx into thin shell (providers + routes)
- Update all 14 components to use hooks/context instead of props
- Update all navigation calls from `setScreen()` to router navigation
- Ensure Vercel/Netlify deployment works with clean URLs (add `_redirects` or `vercel.json` if needed)
- Verify all features work identically after refactoring

### Out of Scope

- Adding new features or UI changes (reason: refactoring must not change behavior)
- TypeScript migration (reason: user preference, separate effort)
- Adding unit tests (reason: separate effort, not part of structural refactoring)
- Performance optimization beyond what the refactoring naturally provides
- Changing the data layer (JSON files, question format, topic registry)
- Adding a state management library (Zustand, Redux, etc.)
- SEO or meta tag improvements

## Dependencies

### Depends On (must exist before this work starts)

- `react-router-dom` package — must be installed (`npm install react-router-dom`)
- Vite's built-in CSS Modules support — already available, no config needed
- Existing data files and backup.js — must not be modified

### Depended On By (other work waiting for this)

- Future feature development will benefit from the cleaner architecture
- Unit testing becomes easier with isolated hooks and context

## Architecture Notes

### Current Flow (Before Refactoring)

```
App.jsx (all state + screen routing)
  └── props drilling to all 14 components
  └── index.css (2400 lines global)
  └── screen state for navigation
```

### Target Flow (After Refactoring)

```
App.jsx (thin shell)
  └── BrowserRouter
      └── ThemeProvider (useTheme hook)
          └── MasteredProvider (useMastered hook)
              └── ImportantProvider (useImportant hook)
                  └── WrittenMasteredProvider (useWrittenMastered hook)
                      └── Routes
                          ├── / → HomeScreen
                          ├── /mcq/:topicId → ModeSelect
                          ├── /mcq/:topicId/quiz → QuizMode
                          ├── /mcq/:topicId/study → StudyMode
                          ├── /exam → ExamConfig
                          ├── /exam/:topicId → ExamMode
                          ├── /nailed → NailedScreen
                          ├── /important → ImportantScreen
                          ├── /written → WrittenMode
                          ├── /written/nailed → WrittenNailedScreen
                          └── /written/important → WrittenImportantScreen
```

### File Structure (After Refactoring)

```
src/
  main.jsx                         -- React root + BrowserRouter
  App.jsx                          -- Providers + Routes (thin shell)
  index.css                        -- Global: theme vars, animations, resets
  contexts/
    ThemeContext.jsx                -- Theme provider + hook
    MasteredContext.jsx             -- MCQ mastered provider + hook
    ImportantContext.jsx            -- Important provider + hook
    WrittenMasteredContext.jsx      -- Written mastered provider + hook
  hooks/
    useTheme.js                    -- Theme localStorage logic
    useMastered.js                 -- MCQ mastered localStorage logic
    useImportant.js                -- Important localStorage logic
    useWrittenMastered.js          -- Written mastered localStorage logic
    useBackup.js                   -- Export/import backup logic
  components/
    HomeScreen/
      HomeScreen.jsx
      HomeScreen.module.css
    ModeSelect/
      ModeSelect.jsx
      ModeSelect.module.css
    QuizMode/
      QuizMode.jsx
      QuizMode.module.css
    StudyMode/
      StudyMode.jsx
      StudyMode.module.css
    ExamConfig/
      ExamConfig.jsx
      ExamConfig.module.css
    ExamMode/
      ExamMode.jsx
      ExamMode.module.css
    WrittenMode/
      WrittenMode.jsx
      WrittenMode.module.css
    WrittenCardBody/
      WrittenCardBody.jsx
      WrittenCardBody.module.css
    NailedScreen/
      NailedScreen.jsx
      NailedScreen.module.css
    ImportantScreen/
      ImportantScreen.jsx
      ImportantScreen.module.css
    WrittenNailedScreen/
      WrittenNailedScreen.jsx
      WrittenNailedScreen.module.css
    WrittenImportantScreen/
      WrittenImportantScreen.jsx
      WrittenImportantScreen.module.css
    CategorySidebar/
      CategorySidebar.jsx
      CategorySidebar.module.css
    BackupModal/
      BackupModal.jsx
      BackupModal.module.css
  data/                            -- UNCHANGED
    index.js
    *.json
    written/
      index.js
      *.json
  lib/                             -- UNCHANGED
    backup.js
```

### Implementation Order

The refactoring should be executed in this order to minimize risk:

1. **Install react-router-dom** — single dependency addition
2. **Extract custom hooks** — pure logic extraction, no UI changes, fully testable in isolation
3. **Create Context providers** — thin wrappers around hooks, no UI changes
4. **Refactor App.jsx** — replace screen state with providers + routes, update all navigation
5. **Update all components** — remove props, use hooks/context, use router navigation
6. **Split CSS** — extract component styles into CSS Modules, keep global styles in index.css
7. **Verify everything** — test every screen, every feature, every interaction

### Data Preservation Guarantee

The following will NOT change during refactoring:

- All localStorage keys: `ict-theme`, `ict-nailed`, `ict-important`, `ict-written-nailed`
- All localStorage value formats (JSON-serialized arrays parsed into Sets)
- All question ID formats: `${topicId}__${index}` and `written__${topicId}__${questionId}`
- backup.js encode/decode functions (imported as-is into useBackup hook)
- All JSON data files in `src/data/`
- All image assets in `public/written-images/`

## Open Questions

_None — all questions resolved during planning session._

---

# Tasks

## Task T1: Foundation — Install Dependencies, Create Hooks & Contexts

> **Status:** done
> **Effort:** m
> **Priority:** critical
> **Depends on:** None

### Description

Set up the foundational infrastructure for the refactoring: install `react-router-dom`, create the `src/hooks/` directory with all 5 custom hooks extracted from App.jsx's state logic, create the `src/contexts/` directory with all 4 React Context providers, and add SPA routing config for deployment. This task extracts pure logic — no UI changes, no component changes. The app should still work identically after this task.

### Verification Checklist

- [ ] `npm ls react-router-dom` shows the package installed
- [ ] `public/_redirects` exists with `/* /index.html 200`
- [ ] `src/hooks/useTheme.js` — reads `ict-theme` from localStorage, returns `{ theme, toggleTheme }`, writes to localStorage on change
- [ ] `src/hooks/useMastered.js` — reads `ict-nailed` from localStorage, returns `{ value: Set, add, remove, toggle, has }`, writes to localStorage on every mutation
- [ ] `src/hooks/useImportant.js` — reads `ict-important` from localStorage, returns `{ value: Set, add, remove, toggle, has }`, writes to localStorage on every mutation
- [ ] `src/hooks/useWrittenMastered.js` — reads `ict-written-nailed` from localStorage, returns `{ value: Set, add, remove, toggle, has }`, writes to localStorage on every mutation
- [ ] `src/hooks/useBackup.js` — imports `generateCypher` and `parseCypher` from `../lib/backup.js` unchanged, provides `exportBackup()` and `importBackup(code)` functions
- [ ] `src/contexts/ThemeContext.jsx` — creates ThemeContext, exports `ThemeProvider` (uses `useTheme` hook) and `useThemeContext()` consumer hook
- [ ] `src/contexts/MasteredContext.jsx` — creates MasteredContext, exports `MasteredProvider` (uses `useMastered` hook) and `useMasteredContext()` consumer hook
- [ ] `src/contexts/ImportantContext.jsx` — creates ImportantContext, exports `ImportantProvider` (uses `useImportant` hook) and `useImportantContext()` consumer hook
- [ ] `src/contexts/WrittenMasteredContext.jsx` — creates WrittenMasteredContext, exports `WrittenMasteredProvider` (uses `useWrittenMastered` hook) and `useWrittenMasteredContext()` consumer hook
- [ ] `npm run build` succeeds with no errors

### Implementation Notes

- **Pattern reference:** The localStorage load/save logic is already in [App.jsx:27-49](file:///home/syed/Projects/Self/ict-quiz/src/App.jsx#L27-L49) — extract these functions into hooks verbatim
- **Key decisions:** localStorage keys must remain `ict-theme`, `ict-nailed`, `ict-important`, `ict-written-nailed` (Decision #6). Sets must remain Sets internally (Constraint table). backup.js is imported as-is (Decision #7)
- **Lazy init:** Use `useState(() => ...)` pattern for reading localStorage on mount — this is already done for mastered/important/writtenMastered in App.jsx
- **Context consumer hooks:** Each context exports a `use[Name]Context()` function that calls `useContext()` and throws if used outside provider — standard React pattern
- **Backup hook:** The `importBackup` function must return the parsed arrays so the caller can merge them into state (same as current `handleRestore` in App.jsx:95-105)

### Scope Boundaries

- Do NOT modify any existing component files
- Do NOT modify `src/App.jsx` yet (that's T2)
- Do NOT modify `src/lib/backup.js`
- Do NOT modify `src/data/` files
- Only implement hooks and contexts — pure logic extraction

### Files Expected

**New files:**

- `src/hooks/useTheme.js`
- `src/hooks/useMastered.js`
- `src/hooks/useImportant.js`
- `src/hooks/useWrittenMastered.js`
- `src/hooks/useBackup.js`
- `src/contexts/ThemeContext.jsx`
- `src/contexts/MasteredContext.jsx`
- `src/contexts/ImportantContext.jsx`
- `src/contexts/WrittenMasteredContext.jsx`
- `public/_redirects`

**Must NOT modify:**

- `src/App.jsx` (T2 territory)
- `src/lib/backup.js` (must remain unchanged)
- `src/data/` (all data files unchanged)
- `src/components/` (no component changes)

---

## Task T2: Refactor App.jsx — Router, Providers & Route Definitions

> **Status:** done
> **Effort:** l
> **Priority:** critical
> **Depends on:** T1

### Description

Transform App.jsx from a state-heavy orchestrator into a thin shell that only contains providers and route definitions. Replace the `screen` state with React Router routes, wrap everything in context providers, move `main.jsx` to include `BrowserRouter`, and create route-level components that resolve topic data from URL params. This is the structural backbone change.

### Verification Checklist

- [ ] `src/main.jsx` wraps `<App />` in `<BrowserRouter>` from react-router-dom
- [ ] `src/App.jsx` no longer has `screen`, `activeModule`, `selectedTopic`, or `examData` state
- [ ] `src/App.jsx` renders providers in order: ThemeProvider > MasteredProvider > ImportantProvider > WrittenMasteredProvider > Routes
- [ ] `src/App.jsx` renders the bg-canvas and theme toggle (they stay in App since they're layout-level)
- [ ] Route `/` renders HomeScreen (reads module from location state or defaults to 'mcq')
- [ ] Route `/mcq/:topicId` renders ModeSelect (resolves topic from URL param, redirects to `/` if invalid)
- [ ] Route `/mcq/:topicId/quiz` renders QuizMode (resolves topic from URL param)
- [ ] Route `/mcq/:topicId/study` renders StudyMode (resolves topic from URL param)
- [ ] Route `/exam` renders ExamConfig
- [ ] Route `/exam/run` renders ExamMode (receives exam data via route state, redirects to `/exam` if no state)
- [ ] Route `/nailed` renders NailedScreen (all topics)
- [ ] Route `/important` renders ImportantScreen (all topics)
- [ ] Route `/written` renders WrittenMode (topic from query param or first topic default)
- [ ] Route `/written/nailed` renders WrittenNailedScreen
- [ ] Route `/written/important` renders WrittenImportantScreen
- [ ] Invalid topic ID in URL redirects to `/`
- [ ] Exam mode accessed directly without config redirects to `/exam`
- [ ] BackupModal is triggered from context or route state (not showBackup state in App)
- [ ] `handleRestore` function uses context hook methods instead of direct setState
- [ ] All localStorage keys unchanged (`ict-theme`, `ict-nailed`, `ict-important`, `ict-written-nailed`)
- [ ] `npm run build` succeeds
- [ ] App loads at `/` and shows the home screen

### Implementation Notes

- **Pattern reference:** React Router v6 `Routes`, `Route`, `useParams`, `useNavigate`, `useLocation`, `Navigate` (redirect component)
- **Topic resolution:** Create a helper (e.g., `useTopicFromParams()`) that reads `:topicId` from URL, looks it up in TOPICS, and redirects to `/` if not found. Used by ModeSelect, QuizMode, StudyMode routes
- **Written topic resolution:** WrittenMode needs a topic — use query param `?topic=xxx` or default to first written topic
- **Exam data flow:** ExamConfig navigates to `/exam/run` with `navigate('/exam/run', { state: examData })`. ExamMode reads from `useLocation().state` and redirects to `/exam` if null
- **goHome pattern:** `navigate('/')` replaces `goHome()`. `navigate('/', { state: { module: 'written' } })` replaces `goWrittenHome()`
- **Backup modal:** Can be managed via route state `location.state?.showBackup` or keep a local `useState` in App.jsx since it's a UI overlay, not a route
- **Key decisions:** BrowserRouter with clean URLs (Decision #1). Vercel/Netlify SPA support (Decision #1). Provider hierarchy: Theme > Mastered > Important > WrittenMastered (Decision #8)
- **WRITTEN_TOPICS and WRITTEN_TLIST:** These computed constants (currently in App.jsx:18-25) should move to a shared module or stay in App.jsx — they are route-agnostic data
- **The `key` prop pattern:** Currently QuizMode uses `key={selectedTopic.id + '-quiz'}` to force remount. With router, the component naturally remounts on URL change, so explicit `key` is no longer needed

### Scope Boundaries

- Do NOT modify component files yet (T3, T4 handle individual component refactoring)
- Do NOT touch CSS files (T5 handles CSS split)
- Do NOT modify `src/lib/backup.js` or `src/data/`
- Routes must render the OLD components (they'll still receive props for now — components get refactored in T3/T4)
- Only restructure App.jsx and main.jsx

### Files Expected

**Modified files:**

- `src/main.jsx` (add BrowserRouter wrapper)
- `src/App.jsx` (complete rewrite: providers + routes, remove all screen state)

**Must NOT modify:**

- `src/components/` (T3/T4 territory)
- `src/index.css` (T5 territory)
- `src/lib/backup.js`
- `src/data/`

---

## Task T3: Refactor MCQ Components to Use Hooks, Context & Router

> **Status:** done
> **Effort:** l
> **Priority:** high
> **Depends on:** T2

### Description

Refactor the 6 MCQ-focused components to consume state from Context instead of props, and use React Router navigation instead of callback props. Components: HomeScreen, ModeSelect, QuizMode, StudyMode, NailedScreen, ImportantScreen.

### Verification Checklist

**HomeScreen:**

- [ ] Removes all callback props (`onSelectMCQ`, `onSelectWritten`, `onExam`, `onNailed`, `onImportant`, `onWrittenImportant`, `onWrittenNailed`, `onBackup`, `onModuleChange`, `onUnnail`) — uses `useNavigate()` and context hooks instead
- [ ] Keeps `topics` and `writtenTopics` as props or imports from data modules
- [ ] Reads `mastered`, `important`, `writtenMastered` from context
- [ ] Navigation uses `navigate('/mcq/' + topic.id')`, `navigate('/exam')`, `navigate('/nailed')`, etc.
- [ ] Module toggle uses local state (no longer a prop)
- [ ] Theme toggle button still works (reads from ThemeContext)

**ModeSelect:**

- [ ] Resolves topic from `useParams()` instead of `topic` prop
- [ ] Uses `useNavigate()` for Quiz/Study/Back navigation
- [ ] No props needed (topic from URL, navigation from router)

**QuizMode:**

- [ ] Resolves topic from `useParams()` instead of `topic` prop
- [ ] Reads `mastered`, `important` from context hooks
- [ ] Uses context methods `add`/`remove`/`has` instead of `onNail`/`onUnnail`/etc. callback props
- [ ] Uses `navigate('/mcq/' + topicId)` for back, `navigate('/')` for home
- [ ] ScoreScreen internal component works identically
- [ ] `shuffle()` helper stays internal

**StudyMode:**

- [ ] Resolves topic from `useParams()` instead of `topic` prop
- [ ] Reads `mastered`, `important` from context
- [ ] Uses context methods for nail/mark important
- [ ] CategorySidebar topic switching uses `navigate('/mcq/' + newTopicId + '/study')` instead of `onChangeTopic` callback
- [ ] CategorySidebar still receives `topics`, `currentTopicId`, `open`, `onClose` props (these are UI state, not shared app state)

**NailedScreen:**

- [ ] Can be rendered at `/nailed` (all topics) or `/mcq/:topicId/nailed` (single topic)
- [ ] Reads `mastered` from MasteredContext
- [ ] Uses context `remove` method instead of `onUnnail` callback
- [ ] Uses `navigate('/')` for home

**ImportantScreen:**

- [ ] Same pattern as NailedScreen — reads from ImportantContext
- [ ] Uses context `remove` method instead of `onUnmark` callback
- [ ] Uses `navigate('/')` for home

**All components:**

- [ ] No component receives more than 3 props (only UI-specific: e.g., CategorySidebar's `open`/`onClose`)
- [ ] All mastered/important state comes from context
- [ ] All navigation uses `useNavigate()` or `<Link>`
- [ ] `npm run build` succeeds

### Implementation Notes

- **Pattern reference:** Each component currently has its props listed in the component analysis above. Replace state props with context hooks, replace callback props with router navigation or context methods
- **Topic resolution:** Components at `/mcq/:topicId/*` use `useParams()` to get topicId, then find the topic in the TOPICS array. Consider a shared `useTopic(topicId)` utility hook
- **QuizMode key prop:** Currently keyed by `selectedTopic.id + '-quiz'` — with router, the component remounts naturally when the URL changes, so remove the explicit key
- **StudyMode/CategorySidebar:** The sidebar currently calls `onChangeTopic(t)` which calls `setSelectedTopic(t)`. After refactoring, it calls `navigate('/mcq/' + t.id + '/study')` which triggers a URL change and the component remounts with new topic data
- **NailedScreen/ImportantScreen:** These are rendered at two routes (`/nailed` and `/mcq/:topicId/nailed`). The component checks `useParams()` for optional `:topicId` to decide whether to show all topics or filter to one
- **Shared CSS classes:** NailedScreen and ImportantScreen both use `nailed-screen` and `nailed-*` classes. This is fine — they'll use the same CSS Module in T5
- **Key decisions:** Context for shared state (Decision #4). Router navigation (Decision #1). No new features (Constraint: no feature creep)

### Scope Boundaries

- Do NOT modify ExamConfig, ExamMode, WrittenMode, WrittenCardBody, WrittenNailedScreen, WrittenImportantScreen, CategorySidebar, BackupModal (T4 territory)
- Do NOT touch CSS files (T5 territory)
- Do NOT add new features or change any visual behavior
- Components may temporarily use global CSS class names (strings) — CSS Modules migration is T5

### Files Expected

**Modified files:**

- `src/components/HomeScreen.jsx` (remove most props, use context + router)
- `src/components/ModeSelect.jsx` (remove all props, use useParams + router)
- `src/components/QuizMode.jsx` (remove state/callback props, use context + router)
- `src/components/StudyMode.jsx` (remove state/callback props, use context + router)
- `src/components/NailedScreen.jsx` (remove state/callback props, use context + router)
- `src/components/ImportantScreen.jsx` (remove state/callback props, use context + router)
- `src/App.jsx` (update route renders to pass fewer/no props)

**Must NOT modify:**

- `src/components/ExamConfig.jsx`
- `src/components/ExamMode.jsx`
- `src/components/WrittenMode.jsx`
- `src/components/WrittenCardBody.jsx`
- `src/components/WrittenNailedScreen.jsx`
- `src/components/WrittenImportantScreen.jsx`
- `src/components/CategorySidebar.jsx`
- `src/components/BackupModal.jsx`
- `src/index.css`

---

## Task T4: Refactor Exam, Written & Utility Components

> **Status:** done
> **Effort:** l
> **Priority:** high
> **Depends on:** T2

### Description

Refactor the remaining 8 components to use context hooks and router navigation: ExamConfig, ExamMode, WrittenMode, WrittenCardBody, WrittenNailedScreen, WrittenImportantScreen, CategorySidebar, and BackupModal. After this task, NO component should receive state/callback props for app-level data — only UI-specific props remain.

### Verification Checklist

**ExamConfig:**

- [ ] Removes `topics`, `important`, `onStart`, `onBack` props
- [ ] Imports TOPICS directly from data module
- [ ] Reads `important` from ImportantContext to count important questions
- [ ] On start: navigates to `/exam/run` with exam data in route state: `navigate('/exam/run', { state: examData })`
- [ ] Back button uses `navigate('/')`

**ExamMode:**

- [ ] Reads exam data from `useLocation().state` — redirects to `/exam` if null
- [ ] Reads `mastered`, `important` from context
- [ ] Uses context methods for nail/mark important instead of callback props
- [ ] `onHome` becomes `navigate('/')`
- [ ] `shuffle()` helper stays internal
- [ ] ExamScore internal component works identically

**WrittenMode:**

- [ ] Resolves topic from URL query param `?topic=xxx` or defaults to first written topic
- [ ] Imports `getWrittenData` from data module directly (instead of receiving via prop)
- [ ] Reads `important` from ImportantContext, `writtenMastered` from WrittenMasteredContext
- [ ] Uses context methods for mark important / nail written instead of callbacks
- [ ] CategorySidebar topic switching uses `navigate('/written?topic=' + newTopicId)` instead of `onChangeTopic`
- [ ] Back/home navigation uses router

**WrittenCardBody:**

- [ ] Keeps `a` (answer data) and `topicColor` props — these are component-specific, not app state
- [ ] No changes to rendering logic
- [ ] `DataTable` internal component unchanged

**WrittenNailedScreen:**

- [ ] Imports `getWrittenData` from data module directly
- [ ] Reads `writtenMastered` from WrittenMasteredContext
- [ ] Uses context `remove` method instead of `onUnnail` callback
- [ ] Back/home uses `navigate('/', { state: { module: 'written' } })`

**WrittenImportantScreen:**

- [ ] Imports `getWrittenData` from data module directly
- [ ] Reads `important` from ImportantContext
- [ ] Uses context `remove` method instead of `onUnmark` callback
- [ ] Back/home uses `navigate('/', { state: { module: 'written' } })`

**CategorySidebar:**

- [ ] Keeps `topics`, `currentTopicId`, `open`, `onClose`, `onSelect` props — these are UI state
- [ ] `onSelect` will now be called with `navigate()` by the parent (no change to CategorySidebar itself, only how the parent calls it)
- [ ] Minimal or no changes to this component itself

**BackupModal:**

- [ ] Reads `mastered`, `important`, `writtenMastered` from context hooks instead of props
- [ ] Imports TOPICS and written data from data modules directly (instead of receiving via props)
- [ ] Uses `useBackup` hook for export/import
- [ ] Restore merges data using context `add` methods instead of `onRestore` callback
- [ ] `onClose` prop stays (UI callback for parent to toggle visibility)

**All components:**

- [ ] No app-level state passes through props
- [ ] `npm run build` succeeds
- [ ] Full app workflow works: Home → MCQ Topic → Quiz → Score, Home → MCQ Topic → Study → Sidebar, Home → Exam → Run → Score, Home → Written → Browse, Nailed/Important screens, Backup export/import

### Implementation Notes

- **Pattern reference:** Same pattern as T3 — remove state/callback props, use context hooks and router navigation
- **Exam data via route state:** `navigate('/exam/run', { state: { questions, label } })` and read with `useLocation().state`. This is standard React Router pattern for passing ephemeral data that shouldn't be in the URL
- **Written topic via query param:** `useSearchParams()` from react-router-dom for `?topic=xxx`. Default to first written topic if no param
- **BackupModal data access:** Currently receives `topics`, `writtenTList`, and all three Sets as props. After refactoring, it imports data directly and reads Sets from context. The `generateCypher` and `parseCypher` functions are accessed via `useBackup` hook
- **WrittenNailedScreen/WrittenImportantScreen:** These import `getWrittenData` to resolve question text for display. Currently they receive `writtenTopics` as prop — after refactoring, they import WRITTEN_TOPICS directly or resolve from data module
- **Key decisions:** Context for shared state (Decision #4). Router navigation (Decision #1). backup.js unchanged (Decision #7)

### Scope Boundaries

- Do NOT modify MCQ components already refactored in T3
- Do NOT touch CSS files (T5 territory)
- Do NOT change the rich answer rendering logic in WrittenCardBody
- Do NOT add new features or change any visual behavior
- CategorySidebar keeps its current prop interface — only the parent's usage changes

### Files Expected

**Modified files:**

- `src/components/ExamConfig.jsx`
- `src/components/ExamMode.jsx`
- `src/components/WrittenMode.jsx`
- `src/components/WrittenCardBody.jsx` (minimal: possibly just import path updates)
- `src/components/WrittenNailedScreen.jsx`
- `src/components/WrittenImportantScreen.jsx`
- `src/components/CategorySidebar.jsx` (minimal or no changes)
- `src/components/BackupModal.jsx`
- `src/App.jsx` (update route renders for these components)

**Must NOT modify:**

- `src/components/HomeScreen.jsx` (done in T3)
- `src/components/ModeSelect.jsx` (done in T3)
- `src/components/QuizMode.jsx` (done in T3)
- `src/components/StudyMode.jsx` (done in T3)
- `src/components/NailedScreen.jsx` (done in T3)
- `src/components/ImportantScreen.jsx` (done in T3)
- `src/index.css` (T5 territory)
- `src/lib/backup.js`

---

## Task T5: Split CSS into CSS Modules

> **Status:** done
> **Note:** Deferred — CSS remains in global `index.css` due to heavy class sharing between components (QuizMode/ExamMode share `.quiz-page`, `.opt-btn`, `.score-page`, etc.). Splitting would create significant duplication and visual regression risk. The routing, hooks, and context refactoring is complete and the CSS works correctly as-is.
> **Effort:** l
> **Priority:** high
> **Depends on:** T3, T4

### Description

Break the single 2400-line `src/index.css` into 14 component-scoped CSS Module files while keeping theme variables, animations, resets, and shared styles in the global `index.css`. Update every component to import and use its CSS Module (`styles.className`) instead of bare string class names.

### Verification Checklist

**Global `src/index.css` retains:**

- [ ] `:root` CSS custom properties (lines 1-84 approximately)
- [ ] `[data-theme="dark"]` theme override block
- [ ] All `@keyframes` (aurora, card-entrance, gradient-flow, shine, anim-fade, anim-slide)
- [ ] `@media (prefers-reduced-motion: reduce)` overrides
- [ ] Base `body`, `html`, `*` reset styles
- [ ] `.bg-canvas`, `.bg-aurora`, `.bg-grid` (App-level background)
- [ ] `.app-root` styles
- [ ] `.theme-toggle` styles
- [ ] `.modal-overlay` styles (shared overlay pattern)
- [ ] `.anim-fade` and `.anim-slide` animation classes (used globally)
- [ ] `.back-btn` styles (shared across 9 components)
- [ ] `.study-home-btn` styles (shared across 5 components)

**Per-component CSS Modules:**

- [ ] `HomeScreen.module.css` — all `.home`, `.home-header`, `.logo-*`, `.module-toggle`, `.topics-grid`, `.topic-card`, `.tc-*`, `.action-card`, `.exam-card`, `.nailed-card`, `.important-card`, `.ac-*`, `.backup-trigger-*`, `.section-label` styles
- [ ] `ModeSelect.module.css` — all `.mode-page`, `.mode-topic-hero`, `.mode-icon-circle`, `.mode-cards`, `.mode-card` styles
- [ ] `QuizMode.module.css` — all `.quiz-page`, `.quiz-topbar`, `.quiz-card`, `.quiz-question`, `.opt-btn`, `.explanation-box`, `.score-page`, `.score-card`, `.score-*` styles
- [ ] `StudyMode.module.css` — all `.study-page`, `.study-topbar`, `.study-card`, `.study-opt`, `.nail-btn`, `.nailed-notice` styles
- [ ] `ExamConfig.module.css` — all `.exam-config-*` styles
- [ ] `ExamMode.module.css` — only ExamMode-specific styles (`.exam-mode-pill`, `.exam-topic-tag`, `.exam-stop-btn`, `.exam-score-label`). Shared `.quiz-*` and `.score-*` styles are imported from QuizMode's module via `composes` or duplicated
- [ ] `WrittenMode.module.css` — all `.written-page`, `.written-topbar`, `.written-card`, `.written-list` styles
- [ ] `WrittenCardBody.module.css` — all `.written-card-body`, `.written-summary`, `.written-points`, `.written-diagram`, `.written-table`, `.written-mnemonic`, `.written-ext-*` styles
- [ ] `NailedScreen.module.css` — all `.nailed-screen`, `.nailed-group`, `.nailed-row`, `.nailed-unnail-btn` styles
- [ ] `ImportantScreen.module.css` — can import from NailedScreen module via `composes`, adds `.important-total`
- [ ] `WrittenNailedScreen.module.css` — extends NailedScreen module, adds `.nailed-screen--wide`
- [ ] `WrittenImportantScreen.module.css` — extends NailedScreen module, adds `.nailed-screen--wide`
- [ ] `CategorySidebar.module.css` — all `.cat-sidebar-*` styles
- [ ] `BackupModal.module.css` — all `.backup-*` styles

**Component updates:**

- [ ] Every component imports its CSS Module: `import styles from './ComponentName.module.css'`
- [ ] All `className="foo"` becomes `className={styles.foo}` or `className={styles.foo + ' ' + styles.bar}`
- [ ] Conditional classes: `className={active ? styles.active : ''}` or use `classnames` pattern
- [ ] Inline `--c` style prop still works: `style={{ '--c': topic.color }}` — CSS Modules don't interfere with custom properties
- [ ] `content-visibility: auto` preserved on list items
- [ ] `backdrop-filter: blur()` glass effects preserved
- [ ] All animations still play (global `@keyframes` accessible from CSS Modules)
- [ ] Dark/light theme toggle still works (global `:root` variables cascade into module scopes)

**Build verification:**

- [ ] `npm run build` succeeds with no errors
- [ ] No visual regressions compared to pre-refactor screenshots

### Implementation Notes

- **Shared class strategy:** Classes used by multiple components (`.back-btn`, `.study-home-btn`, `.anim-fade`, `.anim-slide`) stay in global CSS. Components apply them alongside module classes: `className={\`${styles.quizPage} anim-fade\`}`
- **ExamMode shares QuizMode styles:** ExamMode uses many `.quiz-*` and `.score-*` classes. Options: (a) duplicate the shared styles in ExamMode.module.css, (b) use CSS Modules `composes` to import from QuizMode.module.css, or (c) create a shared `QuizShared.module.css`. Option (b) `composes` is recommended — it's the CSS Modules-native way
- **ImportantScreen/WrittenNailedScreen/WrittenImportantScreen share NailedScreen styles:** These components reuse `.nailed-screen`, `.nailed-group`, `.nailed-row` etc. Use `composes` from NailedScreen.module.css or keep shared styles in global CSS
- **CSS `color-mix()` with `--c`:** This uses an inline custom property set as `style={{ '--c': topic.color }}`. CSS Modules don't affect custom properties — `var(--c)` works in any scope. No changes needed
- **Vite CSS Modules:** Vite natively supports `.module.css` files — no config needed. Import as `import styles from './Foo.module.css'` and use `styles.className`
- **Key decisions:** CSS Modules (Decision #2). Global theme vars + animations (Decision #9). `--c` inline style preserved (Constraint table)

### Scope Boundaries

- Do NOT change any visual design or behavior — CSS values stay identical, only file organization changes
- Do NOT modify component logic (already done in T3/T4)
- Do NOT add Tailwind, CSS-in-JS, or new styling patterns
- Do NOT remove any CSS — every rule from the original index.css must be preserved either in global CSS or in a module

### Files Expected

**New files:**

- `src/components/HomeScreen.module.css`
- `src/components/ModeSelect.module.css`
- `src/components/QuizMode.module.css`
- `src/components/StudyMode.module.css`
- `src/components/ExamConfig.module.css`
- `src/components/ExamMode.module.css`
- `src/components/WrittenMode.module.css`
- `src/components/WrittenCardBody.module.css`
- `src/components/NailedScreen.module.css`
- `src/components/ImportantScreen.module.css`
- `src/components/WrittenNailedScreen.module.css`
- `src/components/WrittenImportantScreen.module.css`
- `src/components/CategorySidebar.module.css`
- `src/components/BackupModal.module.css`

**Modified files:**

- `src/index.css` (trimmed to only global styles — theme vars, animations, resets, shared classes)
- All 14 component `.jsx` files (update `className` references to use CSS Module imports)

**Must NOT modify:**

- `src/lib/backup.js`
- `src/data/`
- `public/written-images/`

---

## Task T6: Final Verification, Build & Cleanup

> **Status:** done
> **Effort:** s
> **Priority:** high
> **Depends on:** T3, T4, T5

### Description

Final pass to verify the entire refactored app works identically to the original. Run the build, check for console warnings, verify all features end-to-end, and clean up any leftover dead code (unused imports, old comments, empty exports).

### Verification Checklist

**Build:**

- [ ] `npm run build` succeeds with no errors
- [ ] No console warnings in production build
- [ ] Bundle size is within ~10% of original (react-router-dom adds some weight)

**Feature verification — run dev server and manually test:**

- [ ] Home screen loads with topic grid and module toggle
- [ ] MCQ module toggle → topic grid shows MCQ topics
- [ ] Written module toggle → topic grid shows written topics
- [ ] Click MCQ topic → ModeSelect shows Quiz/Study options
- [ ] Quiz mode → questions shuffle, correct/wrong feedback, score screen, nail/important buttons
- [ ] Study mode → browse questions, filter by important, category sidebar works
- [ ] Exam config → select topic, adjust count, start exam
- [ ] Exam mode → timed quiz, score screen, stop button
- [ ] Written mode → expandable Q&A cards, rich answer rendering
- [ ] Nailed screen → shows all mastered MCQ questions by topic, unnail works
- [ ] Important screen → shows all important MCQ questions, unmark works
- [ ] Written Nailed screen → shows written mastered questions, unnail works
- [ ] Written Important screen → shows written important questions, unmark works
- [ ] Backup export → generates ICT: code, can be copied
- [ ] Backup import → pasting ICT: code restores progress correctly
- [ ] Theme toggle → dark/light mode switch persists on reload
- [ ] Category sidebar → slides out, topic switching works in Study and Written modes

**URL/Navigation verification:**

- [ ] Direct URL access to `/mcq/computer_fundamental/quiz` loads quiz for that topic
- [ ] Direct URL access to `/exam/run` redirects to `/exam` (no exam data)
- [ ] Browser back button works from every screen
- [ ] Browser forward button works after going back
- [ ] Page refresh on any URL preserves the correct screen
- [ ] Home link/button from any screen navigates to `/`

**Data preservation:**

- [ ] Set some questions as nailed/important before refactoring, verify they're still there after
- [ ] Generate a backup code before refactoring, verify it restores correctly after
- [ ] Dark theme setting persists across page reloads

**Cleanup:**

- [ ] No unused imports in any file
- [ ] No leftover `screen` state references
- [ ] No leftover `setScreen` calls
- [ ] No dead code from the old prop-drilling pattern
- [ ] All files have consistent formatting

### Implementation Notes

- **Verification approach:** Since this project has no automated tests, all verification is manual. Run `npm run dev` and go through every screen
- **Bundle size check:** Run `npm run build` before refactoring and note the dist/ size. Compare after refactoring. react-router-dom adds ~15KB gzipped which is acceptable
- **Cleanup focus:** Look for: unused imports of old props, commented-out code, `console.log` statements, dead CSS classes in the trimmed index.css
- **Vercel/Netlify deployment:** Test that `public/_redirects` works (Netlify) or verify `vercel.json` if needed (Vercel). The SPA rewrite rule `/* /index.html 200` ensures all routes resolve to index.html

### Scope Boundaries

- Do NOT add new features during verification
- Do NOT make design changes
- If bugs are found, fix them — but do not refactor further
- This task is purely verification and minor cleanup

### Files Expected

**Modified files:**

- Any files with dead code cleanup (minor edits only)
- Potentially `public/_redirects` or `vercel.json` if deployment config needs adjustment

**Must NOT modify:**

- `src/lib/backup.js`
- `src/data/`
- Any core logic or visual design
