import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBudgetUsage, getTopBudgetUsage } from "./usage";
import { addTransaction } from "@/lib/transactions/store";
import { updateBudgetLimit } from "./store";

// Seed budgets: Food & Dining 600, Bills 500, Entertainment 300, Groceries 400, Transport 200.
// Seed transactions are dated June; the clock is pinned to September so they don't count.
const spend = (category: Parameters<typeof addTransaction>[0]["category"], amount: number) =>
  addTransaction({ merchant: "t", category, accountId: "a1", date: "2026-09-05", amount: -amount });

beforeEach(() => {
  for (const key of ["__txStore", "__accountStore", "__recurringStore", "__budgetStore"]) {
    Reflect.deleteProperty(globalThis, key);
  }
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("getBudgetUsage", () => {
  it("joins every budget with this month's spending and a percent", () => {
    spend("Food & Dining", 150);
    const food = getBudgetUsage().find((u) => u.category === "Food & Dining")!;
    expect(food).toMatchObject({ budget: 600, spent: 150, percent: 25 });
  });

  it("does not cap percent past 100, so over-budget is visible", () => {
    spend("Transport", 260);
    expect(getBudgetUsage().find((u) => u.category === "Transport")!.percent).toBe(130);
  });

  it("reports 0 percent for a paused (zero) budget rather than dividing by zero", () => {
    updateBudgetLimit("bc5", 0); // Transport
    spend("Transport", 50);
    expect(getBudgetUsage().find((u) => u.category === "Transport")!.percent).toBe(0);
  });
});

describe("getTopBudgetUsage (the dashboard insight)", () => {
  it("is undefined when nothing has been spent this month", () => {
    expect(getTopBudgetUsage()).toBeUndefined();
  });

  it("ranks by percent of budget, not by amount spent", () => {
    spend("Food & Dining", 300); // 50% of 600, larger amount
    spend("Transport", 150);     // 75% of 200, smaller amount
    expect(getTopBudgetUsage()?.category).toBe("Transport");
    expect(Math.round(getTopBudgetUsage()!.percent)).toBe(75);
  });

  it("ignores spending in categories that have no budget at all", () => {
    spend("Shopping", 999); // not a budgeted category
    expect(getTopBudgetUsage()).toBeUndefined();
  });

  it("never alerts on a paused budget even if money was spent there", () => {
    updateBudgetLimit("bc5", 0); // Transport
    spend("Transport", 500);
    spend("Bills", 50); // 10% of 500
    expect(getTopBudgetUsage()?.category).toBe("Bills");
  });

  it("only looks at the current month", () => {
    addTransaction({ merchant: "old", category: "Food & Dining", accountId: "a1", date: "2026-08-20", amount: -599 });
    expect(getTopBudgetUsage()).toBeUndefined();
  });
});
