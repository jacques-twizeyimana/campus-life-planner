/* ============================================================
   stats.js — pure dashboard calculations. No DOM.
   Reused by ui.renderDashboard() and (potentially) tests.
   ============================================================ */

/** Format a Date as a local YYYY-MM-DD string. */
export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 of the week containing `d`. */
export function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const offset = (x.getDay() + 6) % 7; // Mon=0 … Sun=6
  x.setDate(x.getDate() - offset);
  return x;
}

/** Core metrics: count, total minutes, and the most-used tag. */
export function computeStats(records) {
  const total = records.length;
  const totalMinutes = records.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);

  const counts = new Map();
  for (const r of records) {
    const tag = r.tag || '—';
    counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  let topTag = '—';
  let best = -1;
  // Highest count wins; ties broken alphabetically for determinism.
  for (const [tag, n] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (n > best) { best = n; topTag = tag; }
  }

  return { total, totalMinutes, topTag };
}

/**
 * Minutes planned in the current (Mon–Sun) week vs the cap.
 * @returns {{ usedMinutes, capMinutes, remainingMinutes, over, percent }}
 */
export function capInfo(records, weeklyCapHours, now = new Date()) {
  const start = startOfWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 7); // exclusive upper bound

  const usedMinutes = records.reduce((sum, r) => {
    const due = parseLocalDate(r.dueDate);
    if (due && due >= start && due < end) return sum + (Number(r.duration) || 0);
    return sum;
  }, 0);

  const capMinutes = Math.max(0, Number(weeklyCapHours) || 0) * 60;
  const remainingMinutes = capMinutes - usedMinutes;
  const over = capMinutes > 0 && usedMinutes > capMinutes;
  const percent = capMinutes > 0 ? Math.min(100, Math.round((usedMinutes / capMinutes) * 100)) : 0;

  return { usedMinutes, capMinutes, remainingMinutes, over, percent };
}

/** Parse a YYYY-MM-DD string into a local Date (midnight), or null. */
export function parseLocalDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Minutes planned per day across the last 7 days (oldest → today).
 * @returns {{ date, label, minutes }[]}  length 7
 */
export function last7Days(records, now = new Date()) {
  const days = [];
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const iso = toISODate(d);
    const minutes = records.reduce((sum, r) => (r.dueDate === iso ? sum + (Number(r.duration) || 0) : sum), 0);
    days.push({ date: iso, label: d.toLocaleDateString(undefined, { weekday: 'short' }), minutes });
  }
  return days;
}
