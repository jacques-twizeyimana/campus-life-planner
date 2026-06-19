# M1 — Spec & Wireframes

**Theme:** Campus Life Planner
**App:** A responsive, accessible, vanilla HTML/CSS/JS planner for student tasks & events.

---

## 1. Purpose

Students juggle classes, assignments, study blocks, and campus events. The Campus
Life Planner lets a student capture each item with a **title**, a **due date**, an
estimated **duration**, and a **tag**, then sort, search (with regex), and track how
their planned time stacks up against a weekly cap.

Everything is stored locally (no backend, no frameworks). Data can be exported and
re-imported as JSON.

---

## 2. Data Model

Each record is a **task/event**. Stored as an array under one localStorage key.

```jsonc
{
  "id": "task_0001",          // unique, auto-generated, stable
  "title": "Calculus problem set 4",
  "dueDate": "2025-09-29",    // YYYY-MM-DD
  "duration": 90,             // minutes (integer or up to 2 decimals)
  "tag": "Study",             // letters / spaces / hyphens
  "notes": "Chapters 3-4",    // optional free text
  "done": false,              // completion status
  "createdAt": "2025-09-20T10:15:00.000Z", // ISO 8601
  "updatedAt": "2025-09-20T10:15:00.000Z"  // ISO 8601, bumped on edit
}
```

**Storage key:** `campusPlanner:data` (array of records)
**Settings key:** `campusPlanner:settings` (cap, units, theme, search flags)

**ID scheme:** `task_` + zero-padded incrementing counter, derived from the max
existing id so imports never collide.

---

## 3. Feature Map (maps to rubric + milestones)

| Section        | What it does                                                        | Milestone |
|----------------|---------------------------------------------------------------------|-----------|
| About          | Purpose + contact (GitHub, email)                                   | M2/M7     |
| Dashboard      | Total tasks, total minutes, top tag, last-7-days mini chart, cap    | M5        |
| Records        | Table on desktop / cards on mobile; sort + regex search + highlight | M4        |
| Add / Edit     | Form with 4+ regex validations, inline errors, inline row edit      | M3/M7     |
| Settings       | Weekly cap, minutes↔hours unit display, theme, import/export, reset | M6        |

---

## 4. Regex Catalog (planned — min 4, incl. 1 advanced)

| # | Field / Use            | Pattern                                              | Purpose |
|---|------------------------|------------------------------------------------------|---------|
| 1 | Title (no edge spaces) | `^\S(?:.*\S)?$`                                       | forbid leading/trailing spaces |
| 2 | Duration (number)      | `^(0|[1-9]\d*)(\.\d{1,2})?$`                          | non-negative, ≤2 decimals |
| 3 | Due date (YYYY-MM-DD)  | `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$`       | valid calendar-ish date |
| 4 | Tag (letters/space/-)  | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$`                       | clean tag tokens |
| 5 | **Advanced** — dup word| `\b(\w+)\s+\1\b`  (back-reference)                   | catch "the the" in title/notes |
| 6 | Search — time token    | `\b\d{2}:\d{2}\b`                                     | find "14:30"-style tokens |
| 7 | Search — @tag filter   | `^@tag:\w+`                                           | quick tag filtering |

Live search compiles user input safely via `try/catch`, with a case-insensitive toggle,
and highlights matches using `<mark>`.

---

## 5. Accessibility Plan

- **Landmarks:** `header`, `nav`, `main`, `section`, `footer`; one `h1`, logical heading order.
- **Skip link:** "Skip to content" as the first focusable element.
- **Forms:** every input has a bound `<label for>`; errors via `aria-describedby` +
  `aria-invalid`; error container is `role="alert"`.
- **Live regions:** status messages (`role="status"`, `aria-live="polite"`); cap
  **overage** announced `aria-live="assertive"`.
- **Focus:** visible focus ring on every interactive element (never `outline:none`
  without a replacement).
- **Keyboard:** full flow — tab order, Enter to submit, Esc to cancel inline edit,
  delete confirmation reachable by keyboard.
- **Search highlight:** `<mark>` keeps text readable; not relied on as sole signal.
- **Contrast:** all text ≥ 4.5:1 (large ≥ 3:1). Accent chosen to pass on neutral bg.
- **Color independence:** tags/status use text + shape, not color alone.

---

## 6. Responsive Plan (mobile-first, ≥3 breakpoints)

| Breakpoint | Layout |
|------------|--------|
| ~360px (base) | single column; records as **cards**; stacked form; hamburger/collapsed nav |
| ~768px (tablet) | 2-column dashboard stats; form fields in 2 columns; nav inline |
| ~1024px (desktop) | records as **table**; sidebar-style stats + main content; wider container |

CSS: Flexbox + media queries, CSS custom properties for theming, one tasteful
transition (card hover / focus, and a chart bar grow animation).

---

## 7. Module Plan (vanilla ES modules)

```
scripts/
  storage.js     # load/save localStorage, settings, safe JSON parse
  state.js       # in-memory records + settings, CRUD, id generation, events
  validators.js  # regex rules + validateRecord(), returns field errors
  search.js      # safe regex compile + highlight
  ui.js          # render table/cards, dashboard, forms, dialogs
  app.js         # wire everything: events, init, import/export
```

`tests/tests.html` holds small assertions for validators + search compiler.

---

## 8. Milestone Roadmap (commit plan)

- **M1** Spec & wireframes, data model, a11y plan ← *this doc*
- **M2** Semantic HTML skeleton + mobile-first base CSS
- **M3** Forms + 4+ regex validations + tests.html
- **M4** Render table/cards + sort + safe regex search + highlight
- **M5** Stats dashboard + weekly cap + ARIA live updates
- **M6** localStorage autosave + JSON import/export + settings (units)
- **M7** Polish, a11y audit, README, seed.json, demo video
