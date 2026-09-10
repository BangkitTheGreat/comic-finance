/**
 * Maximum allowed search query length to prevent DoS / payload inflation.
 */
export const MAX_SEARCH_LENGTH = 100;

/**
 * Builds a secure, URL-encoded search target for the transactions page.
 *
 * Security & Reliability considerations:
 * 1. Open redirect protection: Strictly binds navigation to the internal relative `/transactions` route.
 * 2. URL injection & parameter pollution: Uses WHATWG URLSearchParams to encode special characters (&, =, ?, #, %, etc.).
 * 3. Space normalization: Trims leading/trailing spaces and preserves valid intra-word spaces properly encoded.
 * 4. Empty/whitespace input: Navigates cleanly to `/transactions` without an empty `?q=` query string.
 * 5. DoS mitigation: Bounds maximum query length to prevent overly large URLs.
 */
export function buildSearchTransactionUrl(rawQuery: string): string {
  const sanitized = (rawQuery ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

  if (!sanitized) {
    return "/transactions";
  }

  const params = new URLSearchParams({ q: sanitized });
  return `/transactions?${params.toString()}`;
}

/**
 * Builds a secure, URL-encoded target link for a specific transaction.
 */
export function buildTransactionDetailUrl(transactionId: string): string {
  const sanitized = (transactionId ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

  if (!sanitized) {
    return "/transactions";
  }

  const params = new URLSearchParams({ transactionId: sanitized });
  return `/transactions?${params.toString()}`;
}

