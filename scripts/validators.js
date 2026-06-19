/* ============================================================
   validators.js — regex rules + record validation.
   Pure functions, no DOM. Reused by the form and tests.html.
   ============================================================ */

/**
 * Regex catalog (see README). Four field rules + one advanced
 * back-reference rule for duplicate words.
 */
export const patterns = {
  // 1. Title: no leading/trailing whitespace, at least one non-space char.
  title: /^\S(?:.*\S)?$/,
  // 2. Numeric: non-negative integer or up to 2 decimals, no leading zeros.
  duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  // 3. Date: YYYY-MM-DD with valid month/day ranges.
  dueDate: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  // 4. Tag: letters, separated by single spaces or hyphens.
  tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  // 5. ADVANCED — back-reference: catches a repeated word ("the the").
  duplicateWord: /\b(\w+)\s+\1\b/i,
};

/** True if the string is a real calendar date (not just regex-shaped). */
export function isRealDate(value) {
  if (!patterns.dueDate.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Validate a single field. Returns '' when valid, else an error message.
 * @param {string} field  one of title|dueDate|duration|tag|notes
 * @param {string} rawValue
 */
export function validateField(field, rawValue) {
  const value = rawValue == null ? '' : String(rawValue);

  switch (field) {
    case 'title': {
      if (value.trim() === '') return 'Title is required.';
      if (!patterns.title.test(value)) return 'No leading or trailing spaces allowed.';
      if (patterns.duplicateWord.test(value)) return 'Looks like a duplicated word — please fix.';
      return '';
    }
    case 'dueDate': {
      if (value.trim() === '') return 'Due date is required.';
      if (!patterns.dueDate.test(value)) return 'Use the format YYYY-MM-DD.';
      if (!isRealDate(value)) return 'That date does not exist on the calendar.';
      return '';
    }
    case 'duration': {
      if (value.trim() === '') return 'Duration is required.';
      if (!patterns.duration.test(value)) return 'Enter a number (max 2 decimals), e.g. 90 or 45.5.';
      return '';
    }
    case 'tag': {
      if (value.trim() === '') return 'Tag is required.';
      if (!patterns.tag.test(value)) return 'Letters only; single spaces or hyphens between words.';
      return '';
    }
    case 'notes': {
      // Optional, but if present catch duplicated words too.
      if (value !== '' && patterns.duplicateWord.test(value)) return 'Looks like a duplicated word in notes.';
      return '';
    }
    default:
      return '';
  }
}

/** Fields validated on a task record, in display order. */
export const RECORD_FIELDS = ['title', 'dueDate', 'duration', 'tag', 'notes'];

/**
 * Validate a whole record (raw string values from the form).
 * @returns {{ valid: boolean, errors: Record<string,string> }}
 */
export function validateRecord(values) {
  const errors = {};
  for (const field of RECORD_FIELDS) {
    const msg = validateField(field, values[field]);
    if (msg) errors[field] = msg;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Shape check used when importing JSON (M6). Validates one parsed record. */
export function isValidRecordShape(rec) {
  if (!rec || typeof rec !== 'object') return false;
  const okStrings = ['id', 'title', 'dueDate', 'tag'].every((k) => typeof rec[k] === 'string' && rec[k].length);
  if (!okStrings) return false;
  if (typeof rec.duration !== 'number' || Number.isNaN(rec.duration)) return false;
  // Field contents must also pass the same rules used on input.
  return validateRecord({
    title: rec.title,
    dueDate: rec.dueDate,
    duration: String(rec.duration),
    tag: rec.tag,
    notes: rec.notes ?? '',
  }).valid;
}
