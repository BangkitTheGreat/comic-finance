import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { createTransaction, editTransaction } from "@/lib/transactions/actions";
import { createRecurring, editRecurring } from "@/lib/recurring/actions";
import { listTransactions, getTransaction } from "@/lib/transactions/store";
import { listRecurring, processDueRecurring, getRecurring } from "@/lib/recurring/store";
import { CURRENCIES, type CurrencyCode } from "./types";
import { amountInputValue } from "./input";
import { setCurrencyCode } from "./store";
import { getAccountsWithBalances, addAccount } from "@/lib/accounts/store";
import { addTransaction } from "@/lib/transactions/store";
import { addRecurring } from "@/lib/recurring/store";
import { todayIso } from "@/lib/dates";
import { getCategoryByName } from "@/lib/categories/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const cat = (name: string) => getCategoryByName(WS, name)!.id;

function data(code: string, amount: string, id?: string) {
 const f = new FormData();
 for (const [k,v] of Object.entries({ merchant: "FX Test", categoryId: cat("Other"), accountId: "a1", type: "expense", date: "2026-09-09", nextDue: "2026-09-09", frequency: "monthly", currencyCode: code, amount, ...(id ? {id} : {}) })) f.set(k,v);
 return f;
}
beforeEach(() => {
  resetWorkspaceForTest();
  addAccount(WS, { name: "Main Checking", type: "checking", initialBalance: 7782.0, color: "" }); // a1
  // A pre-existing transaction (t1) and recurring rule (r1) to edit, so the
  // "rejects invalid ... on edit" cases fail on the invalid amount, not on a
  // record that simply doesn't exist.
  addTransaction(WS, { merchant: "Seed", categoryId: cat("Other"), accountId: "a1", date: "2026-09-01", amount: -10 }); // t1
  addRecurring(WS, { merchant: "Seed", categoryId: cat("Other"), accountId: "a1", type: "expense", amount: 10, frequency: "monthly", nextDue: "2026-09-09", active: true }); // r1
});
describe("currency-aware server actions", () => {
 it.each<[CurrencyCode,string,number]>([["USD","1",1],["IDR","16000",1],["EUR","0.92",1],["IDR","1",1/16000],["EUR","0.01",0.01/0.92]])("converts %s %s once and keeps unchanged edits exact",async(code,amount,base) => {
  const before=getAccountsWithBalances(WS)[0].balance;
  expect(await createTransaction(data(code,amount))).toEqual({ok:true});
  const tx=listTransactions(WS).find(t=>t.merchant==="FX Test")!;
  expect(tx.amount).toBe(-base);
  expect(getAccountsWithBalances(WS)[0].balance).toBeCloseTo(before-base,8);
  expect(await createRecurring(data(code,amount))).toEqual({ok:true});
  const rec=listRecurring(WS).find(t=>t.merchant==="FX Test")!;
  expect(rec.amount).toBe(base);
  for(const display of Object.values(CURRENCIES)) {
   setCurrencyCode(WS, display.code);
   const text=amountInputValue(base,display);
   expect(await editTransaction(data(display.code,text,tx.id))).toEqual({ok:true});
   expect(await editRecurring(data(display.code,text,rec.id))).toEqual({ok:true});
   expect(getTransaction(WS, tx.id)?.amount).toBe(-base);
   expect(getRecurring(WS, rec.id)?.amount).toBe(base);
  }
 });
 it("uses the form denomination even if another tab changes display currency",async()=>{
  setCurrencyCode(WS, "EUR"); const form=data("IDR","16000");form.set("rate","0.00001");
  expect(await createTransaction(form)).toEqual({ok:true});
  expect(listTransactions(WS).find(t=>t.merchant==="FX Test")?.amount).toBe(-1);
 });
 it.each([["IDR","1.5"],["USD","0.001"],["EUR","-2"],["USD","0"],["IDR","Infinity"],["EUR","1e2"],["invalid","10"],["__proto__","10"],["","10"],["USD","1000000000001"]])("rejects invalid currency/precision %s %s",async(code,amount)=>{
  const txs=structuredClone(listTransactions(WS)),rules=structuredClone(listRecurring(WS));
  expect((await createTransaction(data(code,amount))).ok).toBe(false);
  expect((await createRecurring(data(code,amount))).ok).toBe(false);
  expect((await editTransaction(data(code,amount,"t1"))).ok).toBe(false);
  expect((await editRecurring(data(code,amount,"r1"))).ok).toBe(false);
  expect(listTransactions(WS)).toEqual(txs);expect(listRecurring(WS)).toEqual(rules);
 });
 it("converts changed edit amounts rather than preserving the old base",async()=>{
  expect(await editTransaction(data("IDR","32000","t1"))).toEqual({ok:true});
  expect(getTransaction(WS, "t1")?.amount).toBe(-2);
  const form=data("EUR","1.84","r1");form.set("type","income");
  expect(await editRecurring(form)).toEqual({ok:true});expect(getRecurring(WS, "r1")?.amount).toBe(2);
 });
 it("posts the converted recurring base without a second FX conversion",async()=>{
  const form=data("IDR","16000");form.set("nextDue",todayIso());
  expect(await createRecurring(form)).toEqual({ok:true});
  processDueRecurring(WS);processDueRecurring(WS);
  const posted=listTransactions(WS).filter(t=>t.merchant==="FX Test");
  expect(posted).toHaveLength(1);expect(posted[0].amount).toBe(-1);
 });
});
