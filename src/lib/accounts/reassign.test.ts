import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { deleteAccount } from "./actions";
import { getAccount, getAccountsWithBalances, addAccount } from "./store";
import { addTransaction, listTransactions } from "@/lib/transactions/store";
import { addRecurring, listRecurring } from "@/lib/recurring/store";

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

const balance = (id: string) => getAccountsWithBalances().find((a) => a.id === id)!.balance;
const usage = (id: string) => {
  const a = getAccountsWithBalances().find((acc) => acc.id === id)!;
  return { transactionCount: a.transactionCount, recurringCount: a.recurringCount };
};

beforeEach(() => {
  for (const key of ["__txStore", "__accountStore", "__recurringStore"]) {
    Reflect.deleteProperty(globalThis, key);
  }
  vi.clearAllMocks();
});

describe("account usage counts", () => {
  it("reports how many records point at each account", () => {
    // Seed data puts all four seeded transactions on a1.
    expect(usage("a1")).toEqual({ transactionCount: 4, recurringCount: 3 });
    expect(usage("a3")).toEqual({ transactionCount: 0, recurringCount: 0 });
  });
});

describe("deleting an account by moving its records", () => {
  it("still refuses a bare delete of an account in use", async () => {
    const result = await deleteAccount(form({ id: "a1" }));
    expect(result.ok).toBe(false);
    expect(getAccount("a1")).toBeDefined();
  });

  it("moves transactions and recurring rules, then deletes", async () => {
    const target = addAccount({ name: "Target", type: "cash", initialBalance: 0, color: "" });
    const movedTransactions = usage("a1").transactionCount;

    const result = await deleteAccount(form({ id: "a1", moveToAccountId: target.id }));

    expect(result).toEqual({ ok: true });
    expect(getAccount("a1")).toBeUndefined();
    expect(listTransactions().every((t) => t.accountId !== "a1")).toBe(true);
    expect(listRecurring().every((r) => r.accountId !== "a1")).toBe(true);
    expect(usage(target.id).transactionCount).toBe(movedTransactions);
  });

  it("carries the moved balance to the destination account", async () => {
    const target = addAccount({ name: "Target", type: "cash", initialBalance: 100, color: "" });
    addTransaction({ merchant: "Move me", category: "Other", accountId: "a3", date: "2026-09-09", amount: -30 });

    // a3 seeds at 2592.8 with no transactions, so its balance is now 2562.8.
    const movedActivity = balance("a3") - getAccount("a3")!.initialBalance;
    expect(movedActivity).toBe(-30);

    expect(await deleteAccount(form({ id: "a3", moveToAccountId: target.id }))).toEqual({ ok: true });

    // The destination absorbs the transaction activity, not the deleted
    // account's opening balance — that balance leaves with the account.
    expect(balance(target.id)).toBe(100 + movedActivity);
  });

  it("leaves other accounts' records untouched", async () => {
    const target = addAccount({ name: "Target", type: "cash", initialBalance: 0, color: "" });
    addTransaction({ merchant: "Stay put", category: "Other", accountId: "a2", date: "2026-09-09", amount: -10 });
    const a2Before = balance("a2");

    await deleteAccount(form({ id: "a1", moveToAccountId: target.id }));

    expect(balance("a2")).toBe(a2Before);
    expect(listTransactions().filter((t) => t.accountId === "a2")).toHaveLength(1);
  });

  it("rejects moving records into the account being deleted", async () => {
    const result = await deleteAccount(form({ id: "a1", moveToAccountId: "a1" }));
    expect(result).toMatchObject({ ok: false, errors: { moveToAccountId: expect.any(String) } });
    expect(getAccount("a1")).toBeDefined();
  });

  it("rejects an unknown destination without moving anything", async () => {
    const before = structuredClone(listTransactions());
    const result = await deleteAccount(form({ id: "a1", moveToAccountId: "nope" }));
    expect(result).toMatchObject({ ok: false, errors: { moveToAccountId: expect.any(String) } });
    expect(listTransactions()).toEqual(before);
    expect(getAccount("a1")).toBeDefined();
  });

  it("reports a missing source account without touching records", async () => {
    const before = structuredClone(listTransactions());
    const result = await deleteAccount(form({ id: "missing", moveToAccountId: "a2" }));
    expect(result.ok).toBe(false);
    expect(listTransactions()).toEqual(before);
  });

  it("keeps a moved recurring rule postable against its new account", async () => {
    const target = addAccount({ name: "Target", type: "cash", initialBalance: 0, color: "" });
    const rule = addRecurring({
      merchant: "Subscription", category: "Entertainment", accountId: "a3",
      type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: true,
    });

    await deleteAccount(form({ id: "a3", moveToAccountId: target.id }));

    const moved = listRecurring().find((r) => r.id === rule.id)!;
    expect(moved.accountId).toBe(target.id);
    // An orphaned rule would be skipped by processDueRecurring; this one resolves.
    expect(getAccount(moved.accountId)).toBeDefined();
  });
});
