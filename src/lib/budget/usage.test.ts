import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBudgetUsage, getTopBudgetUsage, getUnbudgetedSpending } from "./usage";
import { addBudget, updateBudget } from "./store";
import { addTransaction } from "@/lib/transactions/store";
import { getCategoryByName } from "@/lib/categories/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const SEPT = "2026-09";
const cat = (name: string) => getCategoryByName(WS, name)!.id;
const spend = (categoryName: string, amount: number, date = "2026-09-05") =>
  addTransaction(WS, { merchant: "t", categoryId: cat(categoryName), accountId: "a1", date, amount: -amount });
const usageOf = (name: string, month = SEPT) => getBudgetUsage(WS, month).find((u) => u.categoryName === name);

// Budgets for September: Food & Dining 600, Bills 500, Entertainment 300,
// Groceries 400, Transport 200. The clock is pinned to September.
let transportBudgetId: string;
beforeEach(() => {
  resetWorkspaceForTest();
  for (const [name, limit] of [["Food & Dining", 600], ["Bills", 500], ["Entertainment", 300], ["Groceries", 400]] as const) {
    addBudget(WS, { categoryId: cat(name), month: SEPT, limit, status: "active" });
  }
  transportBudgetId = addBudget(WS, { categoryId: cat("Transport"), month: SEPT, limit: 200, status: "active" }).id;
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("getBudgetUsage", () => {
  it("joins every budget with its category and this month's spending", () => {
    spend("Food & Dining", 150);
    expect(usageOf("Food & Dining")).toMatchObject({ limit: 600, spent: 150, percent: 25, icon: "restaurant", status: "active" });
  });

  it("does not cap percent past 100, so 130% reads as 130%", () => {
    spend("Transport", 260);
    expect(usageOf("Transport")!.percent).toBe(130);
  });

  it("reports 0 percent for a paused budget instead of measuring against its limit", () => {
    updateBudget(WS, transportBudgetId, { status: "paused" });
    spend("Transport", 50);
    expect(usageOf("Transport")).toMatchObject({ status: "paused", spent: 50, percent: 0 });
  });

  it("scopes to the requested month", () => {
    spend("Food & Dining", 150);
    expect(getBudgetUsage(WS, "2026-08")).toEqual([]);
    expect(usageOf("Food & Dining", SEPT)!.spent).toBe(150);
  });
});

describe("getTopBudgetUsage (the dashboard insight)", () => {
  it("is undefined when nothing has been spent this month", () => {
    expect(getTopBudgetUsage(WS)).toBeUndefined();
  });

  it("ranks by percent of limit, not by amount spent", () => {
    spend("Food & Dining", 300); // 50% of 600, larger amount
    spend("Transport", 150);     // 75% of 200, smaller amount
    expect(getTopBudgetUsage(WS)?.categoryName).toBe("Transport");
    expect(Math.round(getTopBudgetUsage(WS)!.percent)).toBe(75);
  });

  it("ignores spending in categories that have no budget at all", () => {
    spend("Shopping", 999);
    expect(getTopBudgetUsage(WS)).toBeUndefined();
  });

  it("never alerts on a paused budget even if money was spent there", () => {
    updateBudget(WS, transportBudgetId, { status: "paused" });
    spend("Transport", 500);
    spend("Bills", 50); // 10% of 500
    expect(getTopBudgetUsage(WS)?.categoryName).toBe("Bills");
  });

  it("only looks at the current month", () => {
    spend("Food & Dining", 599, "2026-08-20");
    expect(getTopBudgetUsage(WS)).toBeUndefined();
  });
});

describe("getUnbudgetedSpending", () => {
  it("lists spending in categories with no budget row this month, largest first", () => {
    spend("Shopping", 120);
    spend("Health", 300);
    spend("Food & Dining", 50); // budgeted, must not appear
    expect(getUnbudgetedSpending(WS, SEPT)).toMatchObject([
      { categoryName: "Health", spent: 300, categoryId: cat("Health") },
      { categoryName: "Shopping", spent: 120, categoryId: cat("Shopping") },
    ]);
  });

  it("does not count a paused budget's category as unbudgeted", () => {
    updateBudget(WS, transportBudgetId, { status: "paused" });
    spend("Transport", 80);
    expect(getUnbudgetedSpending(WS, SEPT)).toEqual([]);
  });

  it("is empty when every spent category has a budget", () => {
    spend("Groceries", 10);
    expect(getUnbudgetedSpending(WS, SEPT)).toEqual([]);
  });
});
