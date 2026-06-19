# M1 — Wireframes

Low-fidelity sketches for the three key breakpoints. Cards on mobile → table on desktop.

---

## Mobile (~360px) — base, single column

```
┌─────────────────────────────┐
│ [skip to content]           │  ← first focusable
│ ☰  Campus Life Planner      │  header
├─────────────────────────────┤
│ About Dashboard Records ... │  nav (wraps/collapses)
├─────────────────────────────┤
│ MAIN                        │
│ ┌─────────────────────────┐ │
│ │ This week  4h 30m / 10h │ │  cap status (aria-live)
│ │ ▓▓▓▓▓░░░░░  remaining   │ │
│ └─────────────────────────┘ │
│                             │
│ [ 🔍 search regex.. ] [Aa]  │  search + case toggle
│ Sort: [Date ▾]              │
│                             │
│ ┌─ task card ────────────┐  │
│ │ Calculus pset 4        │  │
│ │ Due 2025-09-29 · 90m   │  │
│ │ #Study      [Edit][Del]│  │
│ └────────────────────────┘  │
│ ┌─ task card ────────────┐  │
│ │ ...                    │  │
│ └────────────────────────┘  │
│                             │
│ [ + Add task ]              │  → opens form section
├─────────────────────────────┤
│ FOOTER  GitHub · email      │
└─────────────────────────────┘
```

## Tablet (~768px) — 2-column stats, inline nav

```
┌───────────────────────────────────────────────┐
│ [skip]  Campus Life Planner   About Dash Rec.. │
├───────────────────────────────────────────────┤
│ ┌── Total ──┐ ┌── Minutes ─┐ ┌── Top tag ───┐ │
│ │   12      │ │   840      │ │   Study      │ │  dashboard grid
│ └───────────┘ └────────────┘ └──────────────┘ │
│ ┌── Last 7 days ───────────────────────────┐  │
│ │  ▁ ▃ ▅ ▂ ▇ ▄ ▁                            │  │  mini chart
│ └──────────────────────────────────────────┘  │
│                                                │
│ [ 🔍 search ........... ] [Aa]  Sort:[Date ▾] │
│ ┌─ card ─────────┐ ┌─ card ─────────┐         │  2-up cards
│ │ ...            │ │ ...            │         │
│ └────────────────┘ └────────────────┘         │
└───────────────────────────────────────────────┘
```

## Desktop (~1024px+) — table view, full chrome

```
┌────────────────────────────────────────────────────────────────┐
│ [skip]  Campus Life Planner        About  Dashboard  Records ⚙ │
├──────────────┬─────────────────────────────────────────────────┤
│ STATS aside  │  [ 🔍 regex search .......... ] [Aa case]        │
│  Total  12   │  ┌──────────────────────────────────────────┐   │
│  Min    840  │  │ Title ⇅ | Due ⇅ | Min ⇅ | Tag | Actions  │   │  sortable th
│  Top  Study  │  ├──────────────────────────────────────────┤   │
│              │  │ Calculus.. │2025-09-29│ 90 │Study│✎ 🗑    │   │
│  This week   │  │ Lab report │2025-10-01│120 │Study│✎ 🗑    │   │
│  ▓▓▓▓░ 4.5/10│  │ ...                                       │   │
│  (aria-live) │  └──────────────────────────────────────────┘   │
│              │  [ + Add task ]                                  │
├──────────────┴─────────────────────────────────────────────────┤
│ FOOTER   GitHub · email · "Built by ..."                        │
└────────────────────────────────────────────────────────────────┘
```

## Add / Edit form (modal/section)

```
┌─ Add task ─────────────────────────┐
│ Title *      [____________________] │  err: role=alert under field
│ Due date *   [YYYY-MM-DD__________] │
│ Duration *   [____] minutes  (=Xh)  │  live minutes↔hours hint
│ Tag *        [____________________] │
│ Notes        [____________________] │
│              [ Cancel ]  [ Save ]   │  Esc cancels, Enter saves
└────────────────────────────────────┘
```

## Inline row edit (desktop table)

Selecting **✎** turns that row's cells into inputs in place; **Save**/**Esc** to
commit/cancel. Delete (**🗑**) asks for confirmation before removing.
