import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { runMutation, ValidationError } from "./action-result";
import { createBudget, copyPreviousMonthBudgets } from "@/lib/budget/actions";
import { listBudgets } from "@/lib/budget/store";
import { createTransaction } from "@/lib/transactions/actions";
import { listTransactions } from "@/lib/transactions/store";
import { addAccount } from "@/lib/accounts/store";
import { getCategoryByName } from "@/lib/categories/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const SEPT = "2026-09";
const cat = (name: string) => getCategoryByName(WS, name)!.id;

beforeEach(() => {
  resetWorkspaceForTest();
  addAccount(WS, { name: "Main", type: "checking", initialBalance: 1000, color: "" }); // a1
  vi.clearAllMocks();
});

/**
 * Risk 8, server half. The client lock in ActionForm stops the common case,
 * but a lock in a browser tab cannot be trusted: these assert the data layer
 * itself refuses a second identical write, so a double click, a retry after
 * a dropped connection, or two tabs cannot produce two records.
 */
describe("repeated submits cannot create duplicates", () => {
  const budgetForm = () => {
    const data = new FormData();
    for (const [k, v] of Object.entries({ currencyCode: "USD", categoryId: cat("Food & Dining"), month: SEPT, limit: "600", status: "active" })) data.set(k, v);
    return data;
  };

  it("refuses a second budget for the same category and month", async () => {
    const results = await Promise.all([createBudget(budgetForm()), createBudget(budgetForm()), createBudget(budgetForm())]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(listBudgets(WS, SEPT)).toHaveLength(1);
  });

  it("refuses a repeated copy of last month rather than duplicating every budget", async () => {
    const { addBudget } = await import("@/lib/budget/store");
    addBudget(WS, { categoryId: cat("Transport"), month: "2026-08", limit: 200, status: "active" });
    const copy = () => {
      const data = new FormData();
      data.set("month", SEPT);
      return data;
    };
    expect((await copyPreviousMonthBudgets(copy())).ok).toBe(true);
    expect((await copyPreviousMonthBudgets(copy())).ok).toBe(false); // nothing left to copy
    expect(listBudgets(WS, SEPT)).toHaveLength(1);
  });

  it("records a genuinely repeated transaction as separate entries, since two identical purchases are legitimate", async () => {
    const txForm = () => {
      const data = new FormData();
      for (const [k, v] of Object.entries({ currencyCode: "USD", merchant: "Coffee", amount: "5", type: "expense", categoryId: cat("Food & Dining"), accountId: "a1", date: "2026-09-05" })) data.set(k, v);
      return data;
    };
    expect(await createTransaction(txForm())).toEqual({ ok: true });
    expect(await createTransaction(txForm())).toEqual({ ok: true });
    // Deliberate: only the client lock guards against a double click here,
    // because the server cannot tell an accidental resubmit from someone
    // buying the same coffee twice.
    expect(listTransactions(WS)).toHaveLength(2);
  });
});

describe("failures surface without corrupting state", () => {
  it("turns a ValidationError into a field error the form can display", () => {
    expect(runMutation(() => { throw new ValidationError("Enter a valid amount.", "amount"); }))
      .toEqual({ ok: false, errors: { amount: "Enter a valid amount." } });
  });

  it("defaults an unfielded ValidationError to the form-level slot", () => {
    expect(runMutation(() => { throw new ValidationError("Gone."); })).toEqual({ ok: false, errors: { form: "Gone." } });
  });

  it("lets an unexpected failure through, so the form shows its connection message instead of claiming success", () => {
    // ActionForm catches this and renders "Unable to save changes."; swallowing
    // it here would report a save that never happened.
    expect(() => runMutation(() => { throw new Error("socket hang up"); })).toThrow("socket hang up");
  });

  it("rolls back a partially applied batch when one write fails", async () => {
    const { addBudget } = await import("@/lib/budget/store");
    const { withTransaction } = await import("@/lib/db/client");
    addBudget(WS, { categoryId: cat("Transport"), month: SEPT, limit: 200, status: "active" });

    expect(() =>
      withTransaction(() => {
        addBudget(WS, { categoryId: cat("Groceries"), month: SEPT, limit: 300, status: "active" });
        // Same category and month as the row above: the unique index rejects it.
        addBudget(WS, { categoryId: cat("Transport"), month: SEPT, limit: 999, status: "active" });
      })
    ).toThrow();

    // The Groceries budget from the same batch must not survive on its own.
    expect(listBudgets(WS, SEPT).map((b) => b.categoryId)).toEqual([cat("Transport")]);
    expect(listBudgets(WS, SEPT)[0].limit).toBe(200);
  });
});
