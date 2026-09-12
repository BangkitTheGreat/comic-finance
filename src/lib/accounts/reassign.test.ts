import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { deleteAccount } from "./actions";
import { getAccount, getAccountsWithBalances, addAccount } from "./store";
import { addTransaction, listTransactions } from "@/lib/transactions/store";
import { addRecurring, listRecurring } from "@/lib/recurring/store";
import { getCategoryByName } from "@/lib/categories/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const cat = (name: string) => getCategoryByName(WS, name)!.id;


function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

const balance = (id: string) => getAccountsWithBalances(WS).find((a) => a.id === id)!.balance;
const usage = (id: string) => {
  const a = getAccountsWithBalances(WS).find((acc) => acc.id === id)!;
  return { transactionCount: a.transactionCount, recurringCount: a.recurringCount };
};

// Recreates the shape the old hardcoded seed gave every test: three
// accounts (a1, a2, a3 — ids line up because nextId assigns them in this
// same creation order), with a1 carrying four transactions and three
// recurring rules, a2/a3 carrying none.
function seedAccounts() {
  addAccount(WS, { name: "Main Checking", type: "checking", initialBalance: 7782.0, color: "" }); // a1
  addAccount(WS, { name: "Emergency Savings", type: "savings", initialBalance: 10000.0, color: "" }); // a2
  addAccount(WS, { name: "Stock Portfolio", type: "investment", initialBalance: 2592.8, color: "" }); // a3
  for (let i = 0; i < 4; i++) {
    addTransaction(WS, { merchant: `Seed ${i}`, categoryId: cat("Other"), accountId: "a1", date: "2026-06-01", amount: -10 });
  }
  for (let i = 0; i < 3; i++) {
    addRecurring(WS, { merchant: `Rule ${i}`, categoryId: cat("Other"), accountId: "a1", type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: true });
  }
}

beforeEach(() => {
  resetWorkspaceForTest();
  seedAccounts();
  vi.clearAllMocks();
});

describe("account usage counts", () => {
  it("reports how many records point at each account", () => {
    expect(usage("a1")).toEqual({ transactionCount: 4, recurringCount: 3 });
    expect(usage("a3")).toEqual({ transactionCount: 0, recurringCount: 0 });
  });
});

describe("deleting an account by moving its records", () => {
  it("still refuses a bare delete of an account in use", async () => {
    const result = await deleteAccount(form({ id: "a1" }));
    expect(result.ok).toBe(false);
    expect(getAccount(WS, "a1")).toBeDefined();
  });

  it("moves transactions and recurring rules, then deletes", async () => {
    const target = addAccount(WS, { name: "Target", type: "cash", initialBalance: 0, color: "" });
    const movedTransactions = usage("a1").transactionCount;

    const result = await deleteAccount(form({ id: "a1", moveToAccountId: target.id }));

    expect(result).toEqual({ ok: true });
    expect(getAccount(WS, "a1")).toBeUndefined();
    expect(listTransactions(WS).every((t) => t.accountId !== "a1")).toBe(true);
    expect(listRecurring(WS).every((r) => r.accountId !== "a1")).toBe(true);
    expect(usage(target.id).transactionCount).toBe(movedTransactions);
  });

  it("carries the moved balance to the destination account", async () => {
    const target = addAccount(WS, { name: "Target", type: "cash", initialBalance: 100, color: "" });
    addTransaction(WS, { merchant: "Move me", categoryId: cat("Other"), accountId: "a3", date: "2026-09-09", amount: -30 });

    // a3 seeds at 2592.8 with no transactions, so its balance is now 2562.8.
    const movedActivity = balance("a3") - getAccount(WS, "a3")!.initialBalance;
    expect(movedActivity).toBe(-30);

    expect(await deleteAccount(form({ id: "a3", moveToAccountId: target.id }))).toEqual({ ok: true });

    // The destination absorbs the transaction activity, not the deleted
    // account's opening balance — that balance leaves with the account.
    expect(balance(target.id)).toBe(100 + movedActivity);
  });

  it("leaves other accounts' records untouched", async () => {
    const target = addAccount(WS, { name: "Target", type: "cash", initialBalance: 0, color: "" });
    addTransaction(WS, { merchant: "Stay put", categoryId: cat("Other"), accountId: "a2", date: "2026-09-09", amount: -10 });
    const a2Before = balance("a2");

    await deleteAccount(form({ id: "a1", moveToAccountId: target.id }));

    expect(balance("a2")).toBe(a2Before);
    expect(listTransactions(WS).filter((t) => t.accountId === "a2")).toHaveLength(1);
  });

  it("rejects moving records into the account being deleted", async () => {
    const result = await deleteAccount(form({ id: "a1", moveToAccountId: "a1" }));
    expect(result).toMatchObject({ ok: false, errors: { moveToAccountId: expect.any(String) } });
    expect(getAccount(WS, "a1")).toBeDefined();
  });

  it("rejects an unknown destination without moving anything", async () => {
    const before = structuredClone(listTransactions(WS));
    const result = await deleteAccount(form({ id: "a1", moveToAccountId: "nope" }));
    expect(result).toMatchObject({ ok: false, errors: { moveToAccountId: expect.any(String) } });
    expect(listTransactions(WS)).toEqual(before);
    expect(getAccount(WS, "a1")).toBeDefined();
  });

  it("reports a missing source account without touching records", async () => {
    const before = structuredClone(listTransactions(WS));
    const result = await deleteAccount(form({ id: "missing", moveToAccountId: "a2" }));
    expect(result.ok).toBe(false);
    expect(listTransactions(WS)).toEqual(before);
  });

  it("keeps a moved recurring rule postable against its new account", async () => {
    const target = addAccount(WS, { name: "Target", type: "cash", initialBalance: 0, color: "" });
    const rule = addRecurring(WS, {
      merchant: "Subscription", categoryId: cat("Entertainment"), accountId: "a3",
      type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: true,
    });

    await deleteAccount(form({ id: "a3", moveToAccountId: target.id }));

    const moved = listRecurring(WS).find((r) => r.id === rule.id)!;
    expect(moved.accountId).toBe(target.id);
    // An orphaned rule would be skipped by processDueRecurring; this one resolves.
    expect(getAccount(WS, moved.accountId)).toBeDefined();
  });
});
