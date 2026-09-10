import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addTransaction } from "./store";
import { getMonthlyExpenses, getMonthlyIncome, getCategorySpending, getMonthlySeries, getNetSavings } from "./analytics";

// Suite is pinned to Asia/Jakarta (UTC+7). At 00:30 local on the 1st, UTC is
// still 17:30 on the last day of the previous month. A transaction the user
// enters "today" is dated by the local calendar, so a UTC-derived current
// month would look at the wrong month and report the day's spending as zero.
const EARLY_MORNING_ON_THE_FIRST = new Date("2026-09-01T00:30:00+07:00");
// The date a browser form submits at that moment: the user's local calendar day.
// Hardcoded rather than derived from the helper under test, so the assertion
// still catches a UTC-derived month instead of moving with it.
const TODAY_LOCAL = "2026-09-01";

beforeEach(() => {
  for (const key of ["__txStore", "__accountStore", "__recurringStore"]) {
    Reflect.deleteProperty(globalThis, key);
  }
  vi.useFakeTimers();
  vi.setSystemTime(EARLY_MORNING_ON_THE_FIRST);
});
afterEach(() => vi.useRealTimers());

describe("month rollover in the early-morning UTC-offset window", () => {
  it("counts a transaction entered today toward this month's totals", () => {
    addTransaction({ merchant: "Midnight Snack", category: "Food & Dining", accountId: "a1", date: TODAY_LOCAL, amount: -25 });
    addTransaction({ merchant: "Payday", category: "Salary", accountId: "a1", date: TODAY_LOCAL, amount: 500 });

    expect(getMonthlyExpenses()).toBe(25);
    expect(getMonthlyIncome()).toBe(500);
    expect(getNetSavings()).toBe(475);
  });

  it("counts it toward budget category spending", () => {
    addTransaction({ merchant: "Midnight Snack", category: "Food & Dining", accountId: "a1", date: TODAY_LOCAL, amount: -25 });
    expect(getCategorySpending().get("Food & Dining")).toBe(25);
  });

  it("keeps the monthly series and the headline totals on the same month", () => {
    addTransaction({ merchant: "Midnight Snack", category: "Food & Dining", accountId: "a1", date: TODAY_LOCAL, amount: -25 });
    const series = getMonthlySeries(3);
    const latest = series[series.length - 1];

    // The series already derived its months locally while the totals derived
    // theirs in UTC, so before the fix these two disagreed on the 1st.
    expect(latest.month).toBe("2026-09");
    expect(latest.expense).toBe(getMonthlyExpenses());
  });

  it("excludes last month's transactions from this month's totals", () => {
    addTransaction({ merchant: "Last Month", category: "Other", accountId: "a1", date: "2026-08-31", amount: -99 });
    expect(getMonthlyExpenses()).toBe(0);
  });
});
