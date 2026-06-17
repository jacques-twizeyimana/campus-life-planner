/* ============================================================
   ui.js — pure rendering of records into the table + cards.
   Receives already-filtered/sorted records from app.js.
   Uses search.js highlight() so all user data is HTML-escaped.
   ============================================================ */

import { highlight, escapeHtml } from './search.js';

const els = {
  tbody: document.querySelector('[data-records-body]'),
  cards: document.querySelector('[data-records-cards]'),
  empty: document.querySelector('[data-empty]'),
  count: document.querySelector('[data-results-count]'),
};

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
