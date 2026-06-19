# Campus Life Planner

An accessible, responsive, **vanilla HTML/CSS/JS** planner for student tasks and
events. Capture each item with a title, due date, estimated duration, and tag — then
sort, search with regular expressions, and keep your planned time under a weekly cap.
No frameworks, no build step, no backend.

> **Theme:** Campus Life Planner (tasks/events, durations, tags, search)

## Live demo

- **App (GitHub Pages):** https://jacques-twizeyimana.github.io/campus-life-planner/
- **Repository:** https://github.com/jacques-twizeyimana/campus-life-planner

---

## Features

- **Dashboard** — total tasks, total planned time, top tag, and a 7-day trend chart.
- **Weekly cap** — set a target in Settings; the app shows remaining time, or overage,
  announced via an ARIA live region (polite under the cap, assertive when exceeded).
- **Records** — responsive **table** on desktop, **cards** on mobile.
- **Sorting** — by due date, title (A↔Z), or duration (↑↓).
- **Live regex search** — type a pattern; it's compiled safely (`try/catch`), with a
  case-insensitive toggle and `<mark>` highlighting of matches.
- **Add / edit / delete** — inline validation, edit in place, confirm-before-delete.
- **Persistence** — every change auto-saves to `localStorage`.
- **Import / export** — round-trip your data as JSON, validated before loading.
- **Units** — display durations in minutes or hours.
- **Light / dark theme** — persisted across sessions.
- **Accessibility-first** — landmarks, skip link, keyboard support, visible focus,
  ARIA live regions, and contrast-checked colors.

---

## Run it locally

Because the app uses **ES modules**, browsers block `import` over the `file://`
protocol — you must serve the folder over HTTP:

```bash
# from the project root, pick any one:
python3 -m http.server 8000
# or
npx serve .
```

Then open **http://localhost:8000/**.

To load the sample data: open **Settings → Import JSON** and choose `seed.json`.

---

## Run the tests

Open **http://localhost:8000/tests/tests.html** in a browser. The page runs assertions
for `validators.js`, `search.js`, and `stats.js` and prints a green
`N passed, 0 failed` summary (red if anything fails). No tooling required.

---

## Project structure

```
index.html            # semantic markup, all sections
seed.json             # 12 diverse sample records
styles/main.css       # tokens, mobile-first layout, 3 breakpoints, dark theme
scripts/
  storage.js          # localStorage load/save (safe JSON, never throws)
  state.js            # single source of truth: CRUD, ids, subscribe/notify
  validators.js       # regex rules + record validation
  search.js           # safe regex compiler + HTML-escaping highlighter
  stats.js            # dashboard metrics, weekly-cap math, 7-day trend
  ui.js               # render table/cards + dashboard
  app.js              # wires DOM → state (events, search, settings, import/export)
tests/tests.html      # in-browser unit tests
docs/                 # M1 spec, data model, a11y plan, wireframes
```

---

## Data model

```jsonc
{
  "id": "task_0001",        // unique, auto-generated (task_NNNN)
  "title": "Calculus problem set 4",
  "dueDate": "2026-06-16",  // YYYY-MM-DD
  "duration": 90,           // minutes
  "tag": "Study",
  "notes": "Chapters 3-4",  // optional
  "done": false,
  "createdAt": "2026-06-10T09:15:00.000Z",
  "updatedAt": "2026-06-10T09:15:00.000Z"
}
```

Stored under `localStorage` key `campusPlanner:data`; settings under
`campusPlanner:settings`.

---

## Regex catalog

Four field-validation rules plus one **advanced** back-reference rule.

| # | Field / use | Pattern | Valid | Rejected |
|---|-------------|---------|-------|----------|
| 1 | Title — no edge spaces | `/^\S(?:.*\S)?$/` | `Calculus pset` | `␣Calculus`, `Calculus␣` |
| 2 | Duration — number, ≤2 dp | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | `90`, `45.5` | `012`, `45.123`, `-5` |
| 3 | Due date — YYYY-MM-DD | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `2026-06-16` | `2026-13-01`, `2026-6-1` |
| 4 | Tag — letters/space/hyphen | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `Group-Work`, `Lab Session` | `Study1`, `Lab␣␣Session` |
| 5 | **Advanced — duplicate word** (back-reference) | `/\b(\w+)\s+\1\b/i` | flags `the the` | `the cat` (no match) |

The date rule is shape-validation; the app additionally rejects impossible calendar
dates (e.g. `2026-02-30`) via `isRealDate()`.

### Search examples (type these into the Records search box)

| Goal | Pattern |
|------|---------|
| Find all "Study" tasks | `\bStudy\b` |
| Find time tokens like 14:30 | `\b\d{2}:\d{2}\b` |
| Catch a duplicated word | `\b(\w+)\s+\1\b` |
| Tasks ending in "draft" | `draft$` |

Toggle **Ignore case** to switch the `i` flag. Invalid patterns are caught and reported
inline instead of throwing; all tasks remain visible.

---

## Keyboard map

| Key | Action |
|-----|--------|
| `Tab` / `Shift`+`Tab` | Move between all interactive elements |
| `Enter` (on "Skip to content") | Jump focus to the main content |
| `Enter` | Submit the form / activate a button or link |
| `Space` | Toggle a checkbox (e.g. Ignore case) |
| `Esc` | Cancel an in-progress edit |
| `Enter` / `Esc` (in delete dialog) | Confirm / cancel deletion |

The entire flow — add, search, sort, edit, delete, import/export, settings — is operable
with the keyboard alone.

---

## Accessibility notes

- **Landmarks & headings:** `header`, `nav`, `main`, `section`, `footer`; a single
  `h1` with a logical heading order.
- **Skip link** is the first focusable element and targets `#main`.
- **Forms:** every input has a bound `<label>`; errors set `aria-invalid` and are
  announced via `role="alert"` containers referenced by `aria-describedby`.
- **Live regions:** status messages use `role="status"`/`aria-live="polite"`; the weekly
  cap message switches to `aria-live="assertive"` when the cap is exceeded.
- **Visible focus** on every interactive element (no bare `outline: none`).
- **Color contrast** meets WCAG AA; tags and status never rely on color alone.
- **Chart** bars are `aria-hidden` with an equivalent visually-hidden text summary.
- **Reduced motion:** transitions are disabled under `prefers-reduced-motion`.
- **Responsive:** mobile-first with breakpoints at ~360px (base), 768px, and 1024px.

---

## Tech & constraints

Vanilla HTML, CSS, and JavaScript (ES modules). **No frameworks** (no Bootstrap, React,
or jQuery). Data persists in `localStorage`; import/export uses validated JSON.

---

## Author

**Jacques Twizeyimana**
GitHub: [@jacques-twizeyimana](https://github.com/jacques-twizeyimana) ·
Email: sandbergjacques500@gmail.com

Individual work — the GitHub account above is the sole contributor. AI assistance was
used during development, as permitted by the assignment.
