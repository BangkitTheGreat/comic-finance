const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Rejects NaN, Infinity, and non-positive values (0 counts as invalid: a transaction moving no money isn't valid input).
export function isPositiveAmount(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

// Strict calendar-date check: rejects malformed strings and out-of-range days
// (e.g. "2026-02-31") that JS Date would otherwise silently roll forward.
export function isValidIsoDate(s: string): boolean {
  if (!ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
