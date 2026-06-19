// Single source of truth for records and settings: CRUD, id generation,
// persistence, and change notifications. Views subscribe(); they never write
// localStorage directly.

import { loadData, saveData, loadSettings, saveSettings } from './storage.js';

let records = loadData();
let settings = loadSettings();
const listeners = new Set();

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

function persist() {
  saveData(records);
  notify();
}

/* ---------- Reads (return copies so callers can't mutate state) ---------- */
export function getRecords() {
  return records.map((r) => ({ ...r }));
}

export function getSettings() {
  return { ...settings };
}

/* ---------- Id generation ---------- */
/** Next id as task_NNNN, derived from the highest existing numeric suffix. */
export function nextId() {
  let max = 0;
  for (const r of records) {
    const m = /^task_(\d+)$/.exec(r.id || '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `task_${String(max + 1).padStart(4, '0')}`;
}

/* ---------- CRUD ---------- */
/** Normalize raw form values into a clean record payload. */
function normalize(values) {
  return {
    title: String(values.title).trim(),
    dueDate: String(values.dueDate).trim(),
    duration: Number(values.duration),
    tag: String(values.tag).trim(),
    notes: values.notes ? String(values.notes).trim() : '',
    done: Boolean(values.done),
  };
}

export function addRecord(values) {
  const now = new Date().toISOString();
  const rec = { id: nextId(), ...normalize(values), createdAt: now, updatedAt: now };
  records.push(rec);
  persist();
  return rec;
}

export function updateRecord(id, values) {
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const existing = records[idx];
  records[idx] = {
    ...existing,
    ...normalize(values),
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  persist();
  return records[idx];
}

export function deleteRecord(id) {
  const before = records.length;
  records = records.filter((r) => r.id !== id);
  if (records.length !== before) persist();
  return records.length !== before;
}

/** Replace the entire dataset (used by JSON import). */
export function replaceAll(newRecords) {
  records = newRecords.map((r) => ({ ...r }));
  persist();
}

/* ---------- Settings ---------- */
export function setSettings(patch) {
  settings = { ...settings, ...patch };
  saveSettings(settings);
  notify();
}
