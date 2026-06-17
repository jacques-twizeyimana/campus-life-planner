/* ============================================================
   app.js — wires the DOM to state + validators + rendering.
   M3: Add form with live regex validation.
   M4: render table/cards, sort, safe regex search + highlight,
       inline edit, and confirm-delete.
   ============================================================ */

import { validateField, validateRecord, RECORD_FIELDS } from './validators.js';
import { addRecord, updateRecord, deleteRecord, getRecords, getSettings, subscribe } from './state.js';
import { compileRegex } from './search.js';
import { renderRecords, renderDashboard, recordText } from './ui.js';
import { computeStats, capInfo, last7Days } from './stats.js';

const form = document.getElementById('task-form');
const formStatus = document.querySelector('[data-form-status]');
const durationHint = document.querySelector('[data-duration-hint]');
const submitBtn = document.querySelector('[data-submit-label]');
const cancelBtn = document.querySelector('[data-cancel]');
const formHeading = document.getElementById('form-h');

const searchInput = document.getElementById('search');
const searchError = document.getElementById('search-error');
const caseToggle = document.getElementById('search-ci');
const sortSelect = document.getElementById('sort');
const recordsSection = document.getElementById('records');

let editingId = null; // null = add mode, else editing this record

/* ============================================================
   Inline error helpers (form)
   ============================================================ */
function setError(field, message) {
  const input = form.elements[field];
  const errorEl = document.getElementById(`${field}-error`);
  if (!input || !errorEl) return;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

function clearAllErrors() {
  RECORD_FIELDS.forEach((field) => setError(field, ''));
}

/* ============================================================
   Duration → human hint (minutes ↔ hours)
   ============================================================ */
export function formatMinutes(min) {
  const n = Number(min);
  if (!Number.isFinite(n) || n <= 0) return '';
  const hours = Math.floor(n / 60);
  const mins = Math.round(n % 60);
  if (hours && mins) return `= ${hours}h ${mins}m`;
  if (hours) return `= ${hours}h`;
  return `= ${mins}m`;
}

function updateDurationHint() {
  if (!durationHint) return;
  durationHint.textContent = formatMinutes(form.elements.duration.value);
}

/* ============================================================
   Live, per-field validation
   ============================================================ */
function wireLiveValidation() {
  RECORD_FIELDS.forEach((field) => {
    const input = form.elements[field];
    if (!input) return;
    input.addEventListener('blur', () => setError(field, validateField(field, input.value)));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        setError(field, validateField(field, input.value));
      }
      if (field === 'duration') updateDurationHint();
    });
  });
}

/* ============================================================
   Add / edit submit
   ============================================================ */
function readForm() {
  return {
    title: form.elements.title.value,
    dueDate: form.elements.dueDate.value,
    duration: form.elements.duration.value,
    tag: form.elements.tag.value,
    notes: form.elements.notes.value,
  };
}

function enterAddMode() {
  editingId = null;
  form.elements.id.value = '';
  if (submitBtn) submitBtn.textContent = 'Add task';
  if (cancelBtn) cancelBtn.hidden = true;
  if (formHeading) formHeading.textContent = 'Add a task';
}

function enterEditMode(rec) {
  editingId = rec.id;
  form.elements.id.value = rec.id;
  form.elements.title.value = rec.title;
  form.elements.dueDate.value = rec.dueDate;
  form.elements.duration.value = rec.duration;
  form.elements.tag.value = rec.tag;
  form.elements.notes.value = rec.notes || '';
  clearAllErrors();
  updateDurationHint();
  if (submitBtn) submitBtn.textContent = 'Save changes';
  if (cancelBtn) cancelBtn.hidden = false;
  if (formHeading) formHeading.textContent = `Editing “${rec.title}”`;
  document.getElementById('form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  form.elements.title.focus();
  formStatus.textContent = `Editing “${rec.title}”. Press Cancel or Escape to stop.`;
}

function handleSubmit(event) {
  event.preventDefault();
  const values = readForm();
  const { valid, errors } = validateRecord(values);

  clearAllErrors();
  if (!valid) {
    Object.entries(errors).forEach(([field, msg]) => setError(field, msg));
    const firstField = RECORD_FIELDS.find((f) => errors[f]);
    if (firstField) form.elements[firstField].focus();
    formStatus.textContent = `Please fix ${Object.keys(errors).length} field(s) above.`;
    return;
  }

  if (editingId) {
    const rec = updateRecord(editingId, values);
    formStatus.textContent = `Saved changes to “${rec.title}”.`;
    form.reset();
    enterAddMode();
  } else {
    const rec = addRecord(values);
    formStatus.textContent = `Added “${rec.title}”.`;
    form.reset();
  }
  clearAllErrors();
  updateDurationHint();
  form.elements.title.focus();
}

function handleReset() {
  clearAllErrors();
  updateDurationHint();
  enterAddMode();
  formStatus.textContent = '';
}

/* ============================================================
   Records: search + sort + render
   ============================================================ */
function currentRegex() {
  const pattern = searchInput ? searchInput.value.trim() : '';
  if (!pattern) {
    if (searchError) { searchError.hidden = true; searchError.textContent = ''; }
    return { re: null, error: false };
  }
  const flags = caseToggle && caseToggle.checked ? 'i' : '';
  const re = compileRegex(pattern, flags);
  if (re === null) {
    if (searchError) { searchError.hidden = false; searchError.textContent = 'Invalid regular expression — showing all tasks.'; }
    return { re: null, error: true };
  }
  if (searchError) { searchError.hidden = true; searchError.textContent = ''; }
  return { re, error: false };
}

function sortRecords(records, value) {
  const [key, dir] = (value || 'dueDate-asc').split('-');
  const factor = dir === 'desc' ? -1 : 1;
  return records.slice().sort((a, b) => {
    let cmp;
    if (key === 'duration') cmp = Number(a.duration) - Number(b.duration);
    else if (key === 'title') cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    else cmp = String(a.dueDate).localeCompare(String(b.dueDate)); // dueDate (ISO sorts lexically)
    return cmp * factor;
  });
}

/** Re-render the records list. Runs on search, sort, and data changes. */
function renderList() {
  const all = getRecords();
  const settings = getSettings();
  const { re } = currentRegex();
  const searching = Boolean(re);

  const filtered = re ? all.filter((rec) => re.test(recordText(rec))) : all;
  const sorted = sortRecords(filtered, sortSelect ? sortSelect.value : 'dueDate-asc');

  renderRecords(sorted, { re, unit: settings.unitDisplay, total: all.length, searching });
}

/** Re-render the dashboard. Runs only on data/settings changes (not on search),
 *  so the cap live-region doesn't re-announce on every keystroke. */
function renderStats() {
  const all = getRecords();
  const settings = getSettings();
  renderDashboard({
    stats: computeStats(all),
    cap: capInfo(all, settings.weeklyCapHours),
    days: last7Days(all),
    unit: settings.unitDisplay,
  });
}

function refresh() {
  renderStats();
  renderList();
}

/* ============================================================
   Edit / delete via event delegation
   ============================================================ */
function handleRecordsClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const rec = getRecords().find((r) => r.id === id);
  if (!rec) return;

  if (btn.dataset.action === 'edit') {
    enterEditMode(rec);
  } else if (btn.dataset.action === 'delete') {
    if (window.confirm(`Delete “${rec.title}”? This cannot be undone.`)) {
      deleteRecord(id);
      if (editingId === id) { form.reset(); enterAddMode(); }
      formStatus.textContent = `Deleted “${rec.title}”.`;
    }
  }
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  if (!form) return;
  wireLiveValidation();
  updateDurationHint();
  enterAddMode();

  form.addEventListener('submit', handleSubmit);
  form.addEventListener('reset', handleReset);

  // Search/sort only re-filter the list; they don't change stats.
  if (searchInput) searchInput.addEventListener('input', renderList);
  if (caseToggle) caseToggle.addEventListener('change', renderList);
  if (sortSelect) sortSelect.addEventListener('change', renderList);
  if (recordsSection) recordsSection.addEventListener('click', handleRecordsClick);

  // Escape cancels an in-progress edit.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editingId) {
      form.reset();
      enterAddMode();
      formStatus.textContent = 'Edit cancelled.';
    }
  });

  subscribe(refresh); // re-render on any state change
  refresh();          // initial paint
}

init();
