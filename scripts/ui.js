// Renders records into the table and cards. Receives already-filtered/sorted
// records from app.js and uses search.js highlight() so all user data is escaped.

import { highlight, escapeHtml } from './search.js';

const els = {
  tbody: document.querySelector('[data-records-body]'),
  cards: document.querySelector('[data-records-cards]'),
  empty: document.querySelector('[data-empty]'),
  count: document.querySelector('[data-results-count]'),
  // dashboard
  statTotal: document.querySelector('[data-stat-total]'),
  statMinutes: document.querySelector('[data-stat-minutes]'),
  statTop: document.querySelector('[data-stat-top]'),
  capUsed: document.querySelector('[data-cap-used]'),
  capTotal: document.querySelector('[data-cap-total]'),
  capFill: document.querySelector('[data-cap-fill]'),
  capMessage: document.querySelector('[data-cap-message]'),
  chart: document.querySelector('[data-chart]'),
};

/** Round minutes to a compact "1h 30m" / "45m" string. */
export function humanMinutes(min) {
  const n = Math.round(Number(min) || 0);
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Display a duration (stored in minutes) per the chosen unit. */
export function formatDuration(min, unit = 'minutes') {
  const n = Number(min) || 0;
  if (unit === 'hours') {
    const h = n / 60;
    const rounded = Math.round(h * 100) / 100;
    return `${rounded} h`;
  }
  return `${n} min`;
}

/** Build the searchable haystack for one record. */
export function recordText(rec) {
  return `${rec.title} ${rec.dueDate} ${rec.duration} ${rec.tag} ${rec.notes || ''}`;
}

function actionsHTML(rec) {
  const label = escapeHtml(rec.title);
  return `
    <button type="button" class="btn btn--sm" data-action="edit" data-id="${rec.id}" aria-label="Edit ${label}">Edit</button>
    <button type="button" class="btn btn--sm btn--danger" data-action="delete" data-id="${rec.id}" aria-label="Delete ${label}">Delete</button>`;
}

function rowHTML(rec, re, unit) {
  return `
    <tr data-id="${rec.id}">
      <td class="cell-title">${highlight(rec.title, re)}${rec.notes ? `<span class="cell-notes">${highlight(rec.notes, re)}</span>` : ''}</td>
      <td>${highlight(rec.dueDate, re)}</td>
      <td>${escapeHtml(formatDuration(rec.duration, unit))}</td>
      <td><span class="tag">${highlight(rec.tag, re)}</span></td>
      <td><div class="row-actions">${actionsHTML(rec)}</div></td>
    </tr>`;
}

function cardHTML(rec, re, unit) {
  return `
    <li class="card" data-id="${rec.id}">
      <h3 class="card__title">${highlight(rec.title, re)}</h3>
      <p class="card__meta">Due ${highlight(rec.dueDate, re)} · ${escapeHtml(formatDuration(rec.duration, unit))}</p>
      ${rec.notes ? `<p class="card__notes">${highlight(rec.notes, re)}</p>` : ''}
      <p><span class="tag">${highlight(rec.tag, re)}</span></p>
      <div class="card__actions">${actionsHTML(rec)}</div>
    </li>`;
}

/**
 * Render the visible records into both table and card views.
 * @param {object[]} records  already filtered + sorted
 * @param {object}   opts     { re, unit, total, searching }
 */
export function renderRecords(records, { re = null, unit = 'minutes', total = records.length, searching = false } = {}) {
  if (els.tbody) els.tbody.innerHTML = records.map((r) => rowHTML(r, re, unit)).join('');
  if (els.cards) els.cards.innerHTML = records.map((r) => cardHTML(r, re, unit)).join('');

  if (els.empty) els.empty.hidden = records.length > 0;

  if (els.count) {
    if (total === 0) {
      els.count.textContent = 'No tasks yet — add your first one below.';
    } else if (searching) {
      els.count.textContent = `${records.length} of ${total} task${total === 1 ? '' : 's'} match.`;
    } else {
      els.count.textContent = `${total} task${total === 1 ? '' : 's'}.`;
    }
  }
}

/**
 * Render the dashboard: core stats, weekly cap status, and 7-day chart.
 * @param {object} data { stats, cap, days, unit }
 */
export function renderDashboard({ stats, cap, days, unit = 'minutes' }) {
  if (els.statTotal) els.statTotal.textContent = String(stats.total);
  if (els.statMinutes) els.statMinutes.textContent = formatDuration(stats.totalMinutes, unit);
  if (els.statTop) els.statTop.textContent = stats.topTag;

  // --- Weekly cap ---
  if (els.capUsed) els.capUsed.textContent = humanMinutes(cap.usedMinutes);
  if (els.capTotal) els.capTotal.textContent = cap.capMinutes ? humanMinutes(cap.capMinutes) : 'no cap';
  if (els.capFill) {
    els.capFill.style.inlineSize = `${cap.percent}%`;
    els.capFill.classList.toggle('is-over', cap.over);
  }
  if (els.capMessage) {
    let msg;
    if (!cap.capMinutes) {
      msg = 'No weekly cap set — add one in Settings.';
    } else if (cap.over) {
      msg = `Over by ${humanMinutes(-cap.remainingMinutes)} — ${humanMinutes(cap.usedMinutes)} planned vs ${humanMinutes(cap.capMinutes)} cap.`;
    } else if (cap.usedMinutes === 0) {
      msg = `Nothing planned this week yet. ${humanMinutes(cap.capMinutes)} available.`;
    } else {
      msg = `${humanMinutes(cap.remainingMinutes)} of ${humanMinutes(cap.capMinutes)} remaining this week.`;
    }
    // Assertive when exceeded, polite otherwise.
    els.capMessage.setAttribute('aria-live', cap.over ? 'assertive' : 'polite');
    els.capMessage.textContent = msg;
  }

  // --- 7-day chart ---
  if (els.chart) {
    const max = Math.max(1, ...days.map((d) => d.minutes));
    const anyData = days.some((d) => d.minutes > 0);
    if (!anyData) {
      els.chart.innerHTML = '<p class="muted">Chart appears once you add tasks with due dates in the last 7 days.</p>';
    } else {
      const bars = days
        .map((d) => {
          const pct = Math.round((d.minutes / max) * 100);
          return `<div class="chart__col" aria-hidden="true">
            <div class="chart__bar" style="block-size:${pct}%"></div>
            <span class="chart__label">${escapeHtml(d.label)}</span>
          </div>`;
        })
        .join('');
      const summary = days.map((d) => `${d.label} ${d.minutes} minutes`).join(', ');
      els.chart.innerHTML = `<div class="chart__row">${bars}</div><p class="visually-hidden">Minutes planned per day: ${escapeHtml(summary)}.</p>`;
    }
  }
}
