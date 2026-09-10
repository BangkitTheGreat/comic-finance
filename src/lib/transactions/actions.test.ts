import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { revalidatePath } from "next/cache";
import { createTransaction, editTransaction, deleteTransaction } from "./actions";
import { listTransactions, getTransaction, updateTransaction } from "./store";
import { createAccount, deleteAccount, editAccount } from "@/lib/accounts/actions";
import { getAccount, getAccountsWithBalances, addAccount } from "@/lib/accounts/store";
import { createRecurring, editRecurring, toggleRecurring, deleteRecurring } from "@/lib/recurring/actions";
import { addRecurring, listRecurring, processDueRecurring } from "@/lib/recurring/store";

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ currencyCode: "USD", merchant: "Test", amount: "100", type: "expense", category: "Other", accountId: "a1", date: "2026-09-09", nextDue: "2026-09-09", frequency: "monthly", ...overrides })) { if (value !== undefined) data.set(key, value); }
  return data;
}
const balance = (id: string) => getAccountsWithBalances().find(a => a.id === id)!.balance;
beforeEach(() => {
  for (const key of ["__txStore", "__accountStore", "__recurringStore"]) Reflect.deleteProperty(globalThis, key);
  vi.clearAllMocks();
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("server action input boundary", () => {
  it.each(["-100", "0", "NaN", "Infinity", "", " ", "1e309", "0.001", "1000000000001"])("rejects invalid amount %s on create and edit without mutation", async amount => {
    const before = structuredClone(listTransactions());
    expect((await createTransaction(form({ amount }))).ok).toBe(false);
    expect((await editTransaction(form({ amount, id: "t1" }))).ok).toBe(false);
    expect(listTransactions()).toEqual(before);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it.each([{ type: "invalid" }, { category: "invalid" }, { date: "2026-02-31" }, { date: "bad" }, { accountId: "missing" }, { merchant: " " }])("rejects invalid fields %j", async overrides => {
    const before = structuredClone(listTransactions());
    expect((await createTransaction(form(overrides))).ok).toBe(false);
    expect((await editTransaction(form({ ...overrides, id: "t1" }))).ok).toBe(false);
    expect(listTransactions()).toEqual(before);
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
    const tx = listTransactions().find(t => t.merchant === "Test")!;
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
    const before = structuredClone(listTransactions());
    expect((await deleteAccount(form({ id: "a1" }))).ok).toBe(false);
    expect(getAccount("a1")).toBeDefined(); expect(listTransactions()).toEqual(before);
  });
  it("blocks accounts referenced by paused recurring rules too", async () => {
    addRecurring({ merchant: "Paused", category: "Other", accountId: "a2", type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: false });
    expect((await deleteAccount(form({ id: "a2" }))).ok).toBe(false);
    expect(getAccount("a2")).toBeDefined();
  });
  it("allows deleting an unused account", async () => {
    expect(await deleteAccount(form({ id: "a3" }))).toEqual({ ok: true });
    expect(getAccount("a3")).toBeUndefined();
  });
  it.each([{ type: "invalid", initialBalance: "0" }, { type: "checking", initialBalance: "Infinity" }])("rejects invalid account data %j", async fields => {
    expect((await createAccount(form({ name: "New", ...fields }))).ok).toBe(false);
  });
});

describe("recurring safety", () => {
  it.each([{ frequency: "invalid" }, { type: "invalid" }, { category: "invalid" }, { amount: "-1" }, { nextDue: "2026-02-31" }, { accountId: "missing" }])("rejects invalid recurring fields %j", async overrides => {
    const before = structuredClone(listRecurring());
    expect((await createRecurring(form(overrides))).ok).toBe(false);
    expect((await editRecurring(form({ ...overrides, id: "r1" }))).ok).toBe(false);
    expect(listRecurring()).toEqual(before);
  });
  it("rejects invalid toggle and missing recurring ids", async () => {
    expect((await toggleRecurring(form({ id: "r1", active: "oops" }))).ok).toBe(false);
    expect((await toggleRecurring(form({ id: "missing", active: "true" }))).ok).toBe(false);
    expect((await editRecurring(form({ id: "missing" }))).ok).toBe(false);
    expect((await deleteRecurring(form({ id: "missing" }))).ok).toBe(false);
  });
  it("posts to the correct account once per due occurrence", async () => {
    const account = addAccount({ name: "Recurring", type: "cash", initialBalance: 100, color: "" });
    expect(await createRecurring(form({ accountId: account.id, amount: "10" }))).toEqual({ ok: true });
    expect(processDueRecurring()).toBe(1); expect(balance(account.id)).toBe(90);
    expect(processDueRecurring()).toBe(0); expect(balance(account.id)).toBe(90);
  });
  it("skips legacy orphan rules without advancing or posting them", async () => {
    const rule = addRecurring({ merchant: "Orphan", category: "Other", accountId: "deleted", type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: true });
    const before = listTransactions().length;
    expect(processDueRecurring()).toBe(0);
    expect(listTransactions()).toHaveLength(before);
    expect(listRecurring().find(r => r.id === rule.id)?.nextDue).toBe("2026-09-09");
    expect((await toggleRecurring(form({ id: rule.id, active: "true" }))).ok).toBe(false);
  });
  it("does not mutate old snapshots when editing", () => {
    const before = getTransaction("t1")!;
    updateTransaction("t1", { amount: -50 });
    expect(before.amount).toBe(-32.5);
    expect(getTransaction("t1")?.amount).toBe(-50);
  });
});
