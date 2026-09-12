import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { copyPreviousMonthBudgets, createBudget, deleteBudget, editBudget } from "./actions";
import { addBudget, getBudget, listBudgets } from "./store";
import { getCategoryByName } from "@/lib/categories/store";
import { addAccount, getAccountsWithBalances } from "@/lib/accounts/store";
import { addTransaction, listTransactions } from "@/lib/transactions/store";
import { OTHER_TEST_WORKSPACE_ID as OTHER, resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const SEPT = "2026-09";
const AUG = "2026-08";
const cat = (name: string) => getCategoryByName(WS, name)!.id;

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ currencyCode: "USD", categoryId: cat("Food & Dining"), month: SEPT, limit: "600", status: "active", ...overrides })) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  resetWorkspaceForTest();
  resetWorkspaceForTest(OTHER);
  vi.clearAllMocks();
});

describe("createBudget", () => {
  it("creates a budget for a category and month", async () => {
    expect(await createBudget(form())).toEqual({ ok: true });
    expect(listBudgets(WS, SEPT)).toMatchObject([{ categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" }]);
  });

  it("allows one budget per category per month, never two", async () => {
    expect(await createBudget(form())).toEqual({ ok: true });
    const dup = await createBudget(form({ limit: "900" }));
    expect(dup).toMatchObject({ ok: false, errors: { categoryId: expect.stringContaining("already has a budget") } });
    expect(listBudgets(WS, SEPT)).toHaveLength(1);
    expect(listBudgets(WS, SEPT)[0].limit).toBe(600);
    // The same category in a different month is a separate budget.
    expect(await createBudget(form({ month: AUG, limit: "400" }))).toEqual({ ok: true });
    expect(listBudgets(WS, AUG)[0].limit).toBe(400);
  });

  it.each(["0", "-100", "NaN", "Infinity", "", " ", "1e309", "1000000000001", "0.001"])(
    "rejects limit %s — a limit must be positive; pausing is a status, not zero",
    async (limit) => {
      expect((await createBudget(form({ limit }))).ok).toBe(false);
      expect(listBudgets(WS, SEPT)).toEqual([]);
    }
  );

  it.each(["2026-13", "2026-9", "bad", "", "2026-09-01"])("rejects invalid month %s", async (month) => {
    expect(await createBudget(form({ month }))).toMatchObject({ ok: false, errors: { month: expect.any(String) } });
  });

  it("rejects an unknown category and an invalid status", async () => {
    expect(await createBudget(form({ categoryId: "missing" }))).toMatchObject({ ok: false, errors: { categoryId: expect.any(String) } });
    expect(await createBudget(form({ status: "stopped" }))).toMatchObject({ ok: false, errors: { status: expect.any(String) } });
    expect(listBudgets(WS, SEPT)).toEqual([]);
  });

  it("converts a non-USD limit into the USD base", async () => {
    expect(await createBudget(form({ currencyCode: "IDR", limit: "16000000" }))).toEqual({ ok: true });
    expect(listBudgets(WS, SEPT)[0].limit).toBeCloseTo(1000, 8);
  });
});

describe("editBudget", () => {
  it("changes limit, category and status but never the month", async () => {
    const b = addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" });
    expect(await editBudget(form({ id: b.id, categoryId: cat("Groceries"), limit: "850.50", status: "paused", month: AUG }))).toEqual({ ok: true });
    expect(getBudget(WS, b.id)).toMatchObject({ categoryId: cat("Groceries"), limit: 850.5, status: "paused", month: SEPT });
  });

  it("editing September leaves August's history untouched", async () => {
    addBudget(WS, { categoryId: cat("Food & Dining"), month: AUG, limit: 400, status: "active" });
    const sept = addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" });
    expect(await editBudget(form({ id: sept.id, limit: "900" }))).toEqual({ ok: true });
    expect(listBudgets(WS, AUG)[0].limit).toBe(400);
    expect(listBudgets(WS, SEPT)[0].limit).toBe(900);
  });

  it("refuses to move a budget onto a category that already has one that month", async () => {
    addBudget(WS, { categoryId: cat("Groceries"), month: SEPT, limit: 300, status: "active" });
    const food = addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" });
    const result = await editBudget(form({ id: food.id, categoryId: cat("Groceries") }));
    expect(result).toMatchObject({ ok: false, errors: { categoryId: expect.stringContaining("already has a budget") } });
    expect(getBudget(WS, food.id)?.categoryId).toBe(cat("Food & Dining"));
  });

  it.each(["0", "-50", "abc"])("rejects invalid limit %s without mutating", async (limit) => {
    const b = addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" });
    expect((await editBudget(form({ id: b.id, limit }))).ok).toBe(false);
    expect(getBudget(WS, b.id)?.limit).toBe(600);
  });

  it("reports not-found on an unknown id", async () => {
    expect(await editBudget(form({ id: "missing" }))).toEqual({ ok: false, errors: { form: "Budget no longer exists." } });
  });

  it("preserves the exact base value on an unchanged display across currency switches", async () => {
    const b = addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" });
    expect(await editBudget(form({ id: b.id, currencyCode: "EUR", limit: (600 * 0.92).toFixed(2) }))).toEqual({ ok: true });
    expect(getBudget(WS, b.id)?.limit).toBe(600);
  });
});

describe("deleteBudget", () => {
  it("removes only the allocation; transactions and balances stay", async () => {
    const account = addAccount(WS, { name: "Main", type: "checking", initialBalance: 1000, color: "" });
    addTransaction(WS, { merchant: "Diner", categoryId: cat("Food & Dining"), accountId: account.id, date: "2026-09-05", amount: -40 });
    const b = addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" });
    const balanceBefore = getAccountsWithBalances(WS)[0].balance;

    expect(await deleteBudget(form({ id: b.id }))).toEqual({ ok: true });

    expect(listBudgets(WS, SEPT)).toEqual([]);
    expect(listTransactions(WS)).toHaveLength(1);
    expect(getAccountsWithBalances(WS)[0].balance).toBe(balanceBefore);
  });

  it("reports not-found on an unknown id", async () => {
    expect((await deleteBudget(form({ id: "missing" }))).ok).toBe(false);
  });
});

describe("copyPreviousMonthBudgets", () => {
  it("copies last month's budgets that are missing this month, atomically", async () => {
    addBudget(WS, { categoryId: cat("Food & Dining"), month: AUG, limit: 400, status: "active" });
    addBudget(WS, { categoryId: cat("Transport"), month: AUG, limit: 200, status: "paused" });
    addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 999, status: "active" });

    expect(await copyPreviousMonthBudgets(form({ month: SEPT }))).toEqual({ ok: true });

    const sept = listBudgets(WS, SEPT);
    expect(sept).toHaveLength(2);
    expect(sept.find((b) => b.categoryId === cat("Food & Dining"))?.limit).toBe(999); // existing one kept
    expect(sept.find((b) => b.categoryId === cat("Transport"))).toMatchObject({ limit: 200, status: "paused" });
    expect(listBudgets(WS, AUG)).toHaveLength(2); // source untouched
  });

  it("explains when there is nothing to copy", async () => {
    expect(await copyPreviousMonthBudgets(form({ month: SEPT }))).toMatchObject({ ok: false, errors: { form: expect.stringContaining("no budgets in August 2026") } });
    addBudget(WS, { categoryId: cat("Food & Dining"), month: AUG, limit: 400, status: "active" });
    addBudget(WS, { categoryId: cat("Food & Dining"), month: SEPT, limit: 600, status: "active" });
    expect(await copyPreviousMonthBudgets(form({ month: SEPT }))).toMatchObject({ ok: false, errors: { form: expect.stringContaining("already exists") } });
    expect(listBudgets(WS, SEPT)).toHaveLength(1);
  });
});

describe("workspace isolation", () => {
  it("cannot edit, delete or copy another workspace's budgets", async () => {
    const otherCategory = getCategoryByName(OTHER, "Food & Dining")!.id;
    const theirs = addBudget(OTHER, { categoryId: otherCategory, month: SEPT, limit: 123, status: "active" });
    addBudget(OTHER, { categoryId: otherCategory, month: AUG, limit: 50, status: "active" });

    expect((await deleteBudget(form({ id: theirs.id }))).ok).toBe(false);
    expect((await editBudget(form({ id: theirs.id, limit: "1" }))).ok).toBe(false);
    expect((await copyPreviousMonthBudgets(form({ month: SEPT }))).ok).toBe(false); // nothing of ours in August

    expect(getBudget(OTHER, theirs.id)?.limit).toBe(123);
    expect(listBudgets(OTHER, SEPT)).toHaveLength(1);
    expect(listBudgets(WS, SEPT)).toEqual([]);
  });
});
