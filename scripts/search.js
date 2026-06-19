/* ============================================================
   search.js — safe regex compilation + accessible highlighting.
   Pure functions, no DOM. UI wiring happens in app.js (M4).
   ============================================================ */

/**
 * Compile a user-supplied pattern without ever throwing.
 * @returns {RegExp|null} null for empty input or invalid syntax.
 */
export function compileRegex(input, flags = 'i') {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
    return null;
  }
}

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape HTML so user data / matches can't inject markup. */
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
}

/**
 * Return HTML with regex matches wrapped in <mark>. Text is escaped first,
 * so the result is safe to assign with innerHTML. When `re` is null the
 * text is returned escaped and unmarked.
 */
export function highlight(text, re) {
  const safe = escapeHtml(text);
  if (!re) return safe;
  // Always match globally so every occurrence is highlighted; guard against
  // empty matches (e.g. patterns like "a*") causing an infinite loop.
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const global = new RegExp(re.source, flags);
  return safe.replace(global, (m) => (m ? `<mark>${m}</mark>` : m));
}
