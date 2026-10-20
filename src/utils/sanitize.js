/**
 * Security & Sanitization Utility
 * Prevents XSS attacks and ensures safe string rendering in the DOM.
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeText(str, maxLength = 120) {
  if (!str) return '';
  const trimmed = String(str).trim();
  const escaped = escapeHtml(trimmed);
  return escaped.length > maxLength ? escaped.substring(0, maxLength) + '...' : escaped;
}
