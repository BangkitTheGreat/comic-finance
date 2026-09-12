import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { revalidatePath } from "next/cache";
import { createTransaction, editTransaction, deleteTransaction } from "./actions";
import { listTransactions, getTransaction, updateTransaction } from "./store";
import { createAccount, deleteAccount, editAccount } from "@/lib/accounts/actions";
import { getAccount, getAccountsWithBalances, addAccount } from "@/lib/accounts/store";
import { createRecurring, editRecurring, toggleRecurring, deleteRecurring } from "@/lib/recurring/actions";
import { addRecurring, listRecurring, processDueRecurring } from "@/lib/recurring/store";
import { addTransaction } from "./store";
import { getCategoryByName } from "@/lib/categories/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const cat = (name: string) => getCategoryByName(WS, name)!.id;


function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ currencyCode: "USD", merchant: "Test", amount: "100", type: "expense", categoryId: cat("Other"), accountId: "a1", date: "2026-09-09", nextDue: "2026-09-09", frequency: "monthly", ...overrides })) { if (value !== undefined) data.set(key, value); }
  return data;
}
const balance = (id: string) => getAccountsWithBalances(WS).find(a => a.id === id)!.balance;
beforeEach(() => {
  resetWorkspaceForTest();
  addAccount(WS, { name: "Main Checking", type: "checking", initialBalance: 7782.0, color: "" }); // a1
  addAccount(WS, { name: "Emergency Savings", type: "savings", initialBalance: 10000.0, color: "" }); // a2
  addAccount(WS, { name: "Stock Portfolio", type: "investment", initialBalance: 2592.8, color: "" }); // a3
  addTransaction(WS, { merchant: "Joe's Diner", categoryId: cat("Food & Dining"), accountId: "a1", date: "2026-06-11", amount: -32.5 }); // t1
  addRecurring(WS, { merchant: "Netflix", categoryId: cat("Entertainment"), accountId: "a1", type: "expense", amount: 15.99, frequency: "monthly", nextDue: "2026-09-15", active: true }); // r1
  vi.clearAllMocks();
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("server action input boundary", () => {
  it.each(["-100", "0", "NaN", "Infinity", "", " ", "1e309", "0.001", "1000000000001"])("rejects invalid amount %s on create and edit without mutation", async amount => {
    const before = structuredClone(listTransactions(WS));
    expect((await createTransaction(form({ amount }))).ok).toBe(false);
    expect((await editTransaction(form({ amount, id: "t1" }))).ok).toBe(false);
    expect(listTransactions(WS)).toEqual(before);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it.each([{ type: "invalid" }, { categoryId: "invalid" }, { date: "2026-02-31" }, { date: "bad" }, { accountId: "missing" }, { merchant: " " }])("rejects invalid fields %j", async overrides => {
    const before = structuredClone(listTransactions(WS));
    expect((await createTransaction(form(overrides))).ok).toBe(false);
    expect((await editTransaction(form({ ...overrides, id: "t1" }))).ok).toBe(false);
    expect(listTransactions(WS)).toEqual(before);
  });
  it("rejects uploaded files in text fields", async () => {
    const data = form(); data.set("merchant", new Blob(["x"]), "x.txt");
    expect(await createTransaction(data)).toMatchObject({ ok: false, errors: { merchant: expect.any(String) } });
  });
  it("reports missing edit/delete records", async () => {
    expect((await editTransaction(form({ id: "missing" }))).ok).toBe(false);
    expect((await deleteTransaction(form({ id: "missing" }))).ok).toBe(false);
    expect((await editAccount(form({ id: "missing", name: "Name", type: "checking", initialBalance: "0" }))).ok).toBe(false);
    expect((await deleteAccount(form({ id: "missing" }))).ok).toBe(false);
  });
  it("applies expense/income signs and updates both accounts after a move", async () => {
    const a = balance("a1"), b = balance("a2");
    expect(await createTransaction(form())).toEqual({ ok: true });
    expect(balance("a1")).toBe(a - 100);
    const tx = listTransactions(WS).find(t => t.merchant === "Test")!;
    expect(await editTransaction(form({ id: tx.id, accountId: "a2", amount: "40", type: "income" }))).toEqual({ ok: true });
    expect(balance("a1")).toBe(a); expect(balance("a2")).toBe(b + 40);
    expect(await editAccount(form({ id: "a2", name: "Renamed", type: "savings", initialBalance: "10000" }))).toEqual({ ok: true });
    expect(balance("a2")).toBe(b + 40);
    expect(await deleteTransaction(form({ id: tx.id }))).toEqual({ ok: true });
    expect(balance("a2")).toBe(b);
  });
  it.each([createTransaction, (f: FormData) => editTransaction(f), (f: FormData) => deleteTransaction(f)])("invalidates every dependent page", async action => {
    expect((await action(form({ id: "t1" }))).ok).toBe(true);
    expect(vi.mocked(revalidatePath).mock.calls.map(c => c[0]).sort()).toEqual(["/", "/accounts", "/budget", "/recurring", "/statistics", "/transactions"]);
  });
});

describe("account integrity", () => {
  it("blocks deleting an account with transactions", async () => {
    const before = structuredClone(listTransactions(WS));
    expect((await deleteAccount(form({ id: "a1" }))).ok).toBe(false);
    expect(getAccount(WS, "a1")).toBeDefined(); expect(listTransactions(WS)).toEqual(before);
  });
  it("blocks accounts referenced by paused recurring rules too", async () => {
    addRecurring(WS, { merchant: "Paused", categoryId: cat("Other"), accountId: "a2", type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: false });
    expect((await deleteAccount(form({ id: "a2" }))).ok).toBe(false);
    expect(getAccount(WS, "a2")).toBeDefined();
  });
  it("allows deleting an unused account", async () => {
    expect(await deleteAccount(form({ id: "a3" }))).toEqual({ ok: true });
    expect(getAccount(WS, "a3")).toBeUndefined();
  });
  it.each([{ type: "invalid", initialBalance: "0" }, { type: "checking", initialBalance: "Infinity" }])("rejects invalid account data %j", async fields => {
    expect((await createAccount(form({ name: "New", ...fields }))).ok).toBe(false);
  });
});

describe("recurring safety", () => {
  it.each([{ frequency: "invalid" }, { type: "invalid" }, { categoryId: "invalid" }, { amount: "-1" }, { nextDue: "2026-02-31" }, { accountId: "missing" }])("rejects invalid recurring fields %j", async overrides => {
    const before = structuredClone(listRecurring(WS));
    expect((await createRecurring(form(overrides))).ok).toBe(false);
    expect((await editRecurring(form({ ...overrides, id: "r1" }))).ok).toBe(false);
    expect(listRecurring(WS)).toEqual(before);
  });
  it("rejects invalid toggle and missing recurring ids", async () => {
    expect((await toggleRecurring(form({ id: "r1", active: "oops" }))).ok).toBe(false);
    expect((await toggleRecurring(form({ id: "missing", active: "true" }))).ok).toBe(false);
    expect((await editRecurring(form({ id: "missing" }))).ok).toBe(false);
    expect((await deleteRecurring(form({ id: "missing" }))).ok).toBe(false);
  });
  it("posts to the correct account once per due occurrence", async () => {
    const account = addAccount(WS, { name: "Recurring", type: "cash", initialBalance: 100, color: "" });
    expect(await createRecurring(form({ accountId: account.id, amount: "10" }))).toEqual({ ok: true });
    expect(processDueRecurring(WS)).toBe(1); expect(balance(account.id)).toBe(90);
    expect(processDueRecurring(WS)).toBe(0); expect(balance(account.id)).toBe(90);
  });
  it("skips legacy orphan rules without advancing or posting them", async () => {
    const rule = addRecurring(WS, { merchant: "Orphan", categoryId: cat("Other"), accountId: "deleted", type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: true });
    const before = listTransactions(WS).length;
    expect(processDueRecurring(WS)).toBe(0);
    expect(listTransactions(WS)).toHaveLength(before);
    expect(listRecurring(WS).find(r => r.id === rule.id)?.nextDue).toBe("2026-09-09");
    expect((await toggleRecurring(form({ id: rule.id, active: "true" }))).ok).toBe(false);
  });
  it("does not mutate old snapshots when editing", () => {
    const before = getTransaction(WS, "t1")!;
    updateTransaction(WS, "t1", { amount: -50 });
    expect(before.amount).toBe(-32.5);
    expect(getTransaction(WS, "t1")?.amount).toBe(-50);
  });
});
