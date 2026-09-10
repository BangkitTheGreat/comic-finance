import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { editBudgetLimit } from "./actions";
import { listBudgetCategories } from "./store";
import { CATEGORIES, CATEGORY_NAMES, getCategoryMeta } from "@/lib/transactions/types";
import { getCategorySpending } from "@/lib/transactions/analytics";
import { addTransaction } from "@/lib/transactions/store";

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ currencyCode: "USD", id: "bc1", budget: "700", ...overrides })) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

const budgetOf = (id: string) => listBudgetCategories().find((c) => c.id === id)!.budget;

beforeEach(() => {
  for (const key of ["__budgetStore", "__txStore", "__accountStore", "__recurringStore"]) Reflect.deleteProperty(globalThis, key);
  vi.clearAllMocks();
});

describe("budget category references", () => {
  // The browser check caught what these assert: a budget whose category does
  // not resolve renders the fallback icon and a blank name, and silently
  // reports zero spent. Unit tests over the store alone never exercised the
  // page's derivation, so nothing failed.
  it("resolves every budget to a real category, never the fallback", () => {
    for (const budget of listBudgetCategories()) {
      expect(CATEGORY_NAMES).toContain(budget.category);
      const meta = getCategoryMeta(budget.category);
      expect(meta.name).toBe(budget.category);
      expect(meta.icon).not.toBe("category"); // the DEFAULT_CATEGORY fallback icon
    }
  });

  it("matches spending on the same key the budget references", () => {
    const budget = listBudgetCategories()[0];
    addTransaction({
      merchant: "Test", category: budget.category, accountId: "a1",
      date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-15`,
      amount: -42,
    });
    expect(getCategorySpending().get(budget.category)).toBe(42);
  });

  it("keeps every category name unique, so name-keyed spending can't collide", () => {
    expect(new Set(CATEGORY_NAMES).size).toBe(CATEGORIES.length);
  });
});

describe("editBudgetLimit", () => {
  it.each(["-100", "NaN", "Infinity", "", " ", "1e309", "1000000000001"])(
    "rejects invalid budget %s without mutating the store",
    async (budget) => {
      const before = budgetOf("bc1");
      const result = await editBudgetLimit(form({ budget }));
      expect(result.ok).toBe(false);
      expect(budgetOf("bc1")).toBe(before);
    }
  );

  it("accepts zero (pausing a category's budget)", async () => {
    const result = await editBudgetLimit(form({ budget: "0" }));
    expect(result.ok).toBe(true);
    expect(budgetOf("bc1")).toBe(0);
  });

  it("updates the limit on a valid submission", async () => {
    const result = await editBudgetLimit(form({ budget: "850.50" }));
    expect(result.ok).toBe(true);
    expect(budgetOf("bc1")).toBe(850.5);
  });

  it("reports not-found on an unknown category id, without throwing", async () => {
    const result = await editBudgetLimit(form({ id: "missing" }));
    expect(result).toEqual({ ok: false, errors: { form: "Budget category no longer exists." } });
  });

  it("does not mutate the seed object shared across categories", async () => {
    const bc2Before = listBudgetCategories().find((c) => c.id === "bc2")!.budget;
    await editBudgetLimit(form({ id: "bc1", budget: "999" }));
    expect(listBudgetCategories().find((c) => c.id === "bc2")!.budget).toBe(bc2Before);
  });

  it("converts a non-USD submission into the USD base", async () => {
    expect(await editBudgetLimit(form({ currencyCode: "IDR", budget: "16000000" }))).toEqual({ ok: true });
    expect(budgetOf("bc1")).toBeCloseTo(1000, 8); // 16,000,000 IDR / 16000 rate
  });

  it("rejects a negative amount even though the shared helper allows non-positive values", async () => {
    const result = await editBudgetLimit(form({ budget: "-50" }));
    expect(result).toEqual({ ok: false, errors: { budget: "Budget limit cannot be negative." } });
    expect(budgetOf("bc1")).toBe(600);
  });

  it("rejects a negative amount in a non-USD currency too", async () => {
    const result = await editBudgetLimit(form({ currencyCode: "EUR", budget: "-50" }));
    expect(result.ok).toBe(false);
    expect(budgetOf("bc1")).toBe(600);
  });

  it("preserves the exact base value on an unchanged display across currency switches", async () => {
    // bc1 seeds at 600 USD base. Editing in EUR at the exact displayed
    // conversion should round-trip without FX drift, same guarantee
    // transactions/recurring already have.
    const before = budgetOf("bc1");
    const eurDisplay = (before * 0.92).toFixed(2);
    expect(await editBudgetLimit(form({ currencyCode: "EUR", budget: eurDisplay }))).toEqual({ ok: true });
    expect(budgetOf("bc1")).toBe(before);
  });
});
