// Calendar helpers that read the LOCAL calendar.
//
// Dates are stored throughout the app as plain "YYYY-MM-DD" strings with local
// intent: they are parsed with `new Date(y, m - 1, d)` (recurring/types.ts
// `advanceDate`/`isDue`, validation.ts `isValidIsoDate`), rendered with
// `new Date(iso + "T00:00:00")`, and compared with `localeCompare`.
//
// `new Date().toISOString()` answers in UTC instead, so east of UTC it names
// the previous day for the whole early-morning window (00:00-07:00 in UTC+7).
// Deriving "today" or "this month" that way disagrees with every other date
// path in the codebase by up to a day — and by a whole month on the 1st.

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toIsoMonth(date: Date): string {
  return toIsoDate(date).slice(0, 7);
}

/** Today as "YYYY-MM-DD" in the local calendar. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** The current month as "YYYY-MM" in the local calendar. */
export function currentMonth(): string {
  return toIsoMonth(new Date());
}

/** A local calendar date `days` away from today, as "YYYY-MM-DD". */
export function isoOffsetDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

const ISO_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Strict "YYYY-MM" check — the key budgets are stored under. */
export function isValidIsoMonth(s: string): boolean {
  return ISO_MONTH_RE.test(s);
}

/** "2026-09" -> "2026-08". Month arithmetic on the 1st, so no day overflow. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toIsoMonth(new Date(y, m - 1 + delta, 1));
}

/** "2026-09" -> "September 2026". */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
