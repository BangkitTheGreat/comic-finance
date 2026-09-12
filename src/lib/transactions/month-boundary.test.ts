import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addAccount } from "@/lib/accounts/store";
import { addTransaction } from "./store";
import { getMonthlyExpenses, getMonthlyIncome, getCategorySpending, getMonthlySeries, getNetSavings } from "./analytics";
import { getCategoryByName } from "@/lib/categories/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const cat = (name: string) => getCategoryByName(WS, name)!.id;


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
  resetWorkspaceForTest();
  addAccount(WS, { name: "Main Checking", type: "checking", initialBalance: 7782.0, color: "" }); // a1
  vi.useFakeTimers();
  vi.setSystemTime(EARLY_MORNING_ON_THE_FIRST);
});
afterEach(() => vi.useRealTimers());

describe("month rollover in the early-morning UTC-offset window", () => {
  it("counts a transaction entered today toward this month's totals", () => {
    addTransaction(WS, { merchant: "Midnight Snack", categoryId: cat("Food & Dining"), accountId: "a1", date: TODAY_LOCAL, amount: -25 });
    addTransaction(WS, { merchant: "Payday", categoryId: cat("Salary"), accountId: "a1", date: TODAY_LOCAL, amount: 500 });

    expect(getMonthlyExpenses(WS)).toBe(25);
    expect(getMonthlyIncome(WS)).toBe(500);
    expect(getNetSavings(WS)).toBe(475);
  });

  it("counts it toward budget category spending", () => {
    addTransaction(WS, { merchant: "Midnight Snack", categoryId: cat("Food & Dining"), accountId: "a1", date: TODAY_LOCAL, amount: -25 });
    expect(getCategorySpending(WS).get(cat("Food & Dining"))).toBe(25);
  });

  it("keeps the monthly series and the headline totals on the same month", () => {
    addTransaction(WS, { merchant: "Midnight Snack", categoryId: cat("Food & Dining"), accountId: "a1", date: TODAY_LOCAL, amount: -25 });
    const series = getMonthlySeries(WS, 3);
    const latest = series[series.length - 1];

    // The series already derived its months locally while the totals derived
    // theirs in UTC, so before the fix these two disagreed on the 1st.
    expect(latest.month).toBe("2026-09");
    expect(latest.expense).toBe(getMonthlyExpenses(WS));
  });

  it("excludes last month's transactions from this month's totals", () => {
    addTransaction(WS, { merchant: "Last Month", categoryId: cat("Other"), accountId: "a1", date: "2026-08-31", amount: -99 });
    expect(getMonthlyExpenses(WS)).toBe(0);
  });
});
