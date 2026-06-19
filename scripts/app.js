/* ============================================================
   app.js — wires the DOM to state + validators.
   M3 scope: Add form with live regex validation + inline errors.
   (Rendering, sort, and search are added in M4.)
   ============================================================ */

import { validateField, validateRecord, RECORD_FIELDS } from './validators.js';
import { addRecord } from './state.js';

const form = document.getElementById('task-form');
const formStatus = document.querySelector('[data-form-status]');
const durationHint = document.querySelector('[data-duration-hint]');

/* ---------- Inline error helpers ---------- */
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

/* ---------- Duration → human hint (minutes ↔ hours) ---------- */
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

/* ---------- Live, per-field validation ---------- */
function wireLiveValidation() {
  RECORD_FIELDS.forEach((field) => {
    const input = form.elements[field];
    if (!input) return;
    // Validate on blur (first pass) and on input once a field has an error.
    input.addEventListener('blur', () => setError(field, validateField(field, input.value)));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        setError(field, validateField(field, input.value));
      }
      if (field === 'duration') updateDurationHint();
    });
  });
}

/* ---------- Submit ---------- */
function readForm() {
  return {
    title: form.elements.title.value,
    dueDate: form.elements.dueDate.value,
    duration: form.elements.duration.value,
    tag: form.elements.tag.value,
    notes: form.elements.notes.value,
  };
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

  const rec = addRecord(values);
  form.reset();
  clearAllErrors();
  updateDurationHint();
  formStatus.textContent = `Added “${rec.title}”.`;
  form.elements.title.focus();
}

function handleReset() {
  clearAllErrors();
  updateDurationHint();
  formStatus.textContent = '';
}

/* ---------- Init ---------- */
function init() {
  if (!form) return;
  wireLiveValidation();
  updateDurationHint();
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('reset', handleReset);
}

init();
