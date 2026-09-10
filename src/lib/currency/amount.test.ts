import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { createTransaction, editTransaction } from "@/lib/transactions/actions";
import { createRecurring, editRecurring } from "@/lib/recurring/actions";
import { listTransactions, getTransaction } from "@/lib/transactions/store";
import { listRecurring, processDueRecurring, getRecurring } from "@/lib/recurring/store";
import { CURRENCIES, type CurrencyCode } from "./types";
import { amountInputValue } from "./input";
import { setCurrencyCode } from "./store";
import { getAccountsWithBalances } from "@/lib/accounts/store";
import { todayIso } from "@/lib/dates";
function data(code: string, amount: string, id?: string) {
 const f = new FormData();
 for (const [k,v] of Object.entries({ merchant: "FX Test", category: "Other", accountId: "a1", type: "expense", date: "2026-09-09", nextDue: "2026-09-09", frequency: "monthly", currencyCode: code, amount, ...(id ? {id} : {}) })) f.set(k,v);
 return f;
}
beforeEach(() => { for(const k of ["__txStore", "__accountStore", "__recurringStore", "__currencyStore"]) Reflect.deleteProperty(globalThis,k); });
describe("currency-aware server actions", () => {
 it.each<[CurrencyCode,string,number]>([["USD","1",1],["IDR","16000",1],["EUR","0.92",1],["IDR","1",1/16000],["EUR","0.01",0.01/0.92]])("converts %s %s once and keeps unchanged edits exact",async(code,amount,base) => {
  const before=getAccountsWithBalances()[0].balance;
  expect(await createTransaction(data(code,amount))).toEqual({ok:true});
  const tx=listTransactions().find(t=>t.merchant==="FX Test")!;
  expect(tx.amount).toBe(-base);
  expect(getAccountsWithBalances()[0].balance).toBeCloseTo(before-base,8);
  expect(await createRecurring(data(code,amount))).toEqual({ok:true});
  const rec=listRecurring().find(t=>t.merchant==="FX Test")!;
  expect(rec.amount).toBe(base);
  for(const display of Object.values(CURRENCIES)) {
   setCurrencyCode(display.code);
   const text=amountInputValue(base,display);
   expect(await editTransaction(data(display.code,text,tx.id))).toEqual({ok:true});
   expect(await editRecurring(data(display.code,text,rec.id))).toEqual({ok:true});
   expect(getTransaction(tx.id)?.amount).toBe(-base);
   expect(getRecurring(rec.id)?.amount).toBe(base);
  }
 });
 it("uses the form denomination even if another tab changes display currency",async()=>{
  setCurrencyCode("EUR"); const form=data("IDR","16000");form.set("rate","0.00001");
  expect(await createTransaction(form)).toEqual({ok:true});
  expect(listTransactions().find(t=>t.merchant==="FX Test")?.amount).toBe(-1);
 });
 it.each([["IDR","1.5"],["USD","0.001"],["EUR","-2"],["USD","0"],["IDR","Infinity"],["EUR","1e2"],["invalid","10"],["__proto__","10"],["","10"],["USD","1000000000001"]])("rejects invalid currency/precision %s %s",async(code,amount)=>{
  const txs=structuredClone(listTransactions()),rules=structuredClone(listRecurring());
  expect((await createTransaction(data(code,amount))).ok).toBe(false);
  expect((await createRecurring(data(code,amount))).ok).toBe(false);
  expect((await editTransaction(data(code,amount,"t1"))).ok).toBe(false);
  expect((await editRecurring(data(code,amount,"r1"))).ok).toBe(false);
  expect(listTransactions()).toEqual(txs);expect(listRecurring()).toEqual(rules);
 });
 it("converts changed edit amounts rather than preserving the old base",async()=>{
  expect(await editTransaction(data("IDR","32000","t1"))).toEqual({ok:true});
  expect(getTransaction("t1")?.amount).toBe(-2);
  const form=data("EUR","1.84","r1");form.set("type","income");
  expect(await editRecurring(form)).toEqual({ok:true});expect(getRecurring("r1")?.amount).toBe(2);
 });
 it("posts the converted recurring base without a second FX conversion",async()=>{
  const form=data("IDR","16000");form.set("nextDue",todayIso());
  expect(await createRecurring(form)).toEqual({ok:true});
  processDueRecurring();processDueRecurring();
  const posted=listTransactions().filter(t=>t.merchant==="FX Test");
  expect(posted).toHaveLength(1);expect(posted[0].amount).toBe(-1);
 });
});
