import { beforeEach, describe, expect, it } from "vitest";
import { isPositiveAmount, isValidIsoDate } from "@/lib/validation";
import { addTransaction, updateTransaction, removeTransaction } from "@/lib/transactions/store";
import { getAccount, updateAccount, getAccountsWithBalances } from "@/lib/accounts/store";

beforeEach(() => {
  Reflect.deleteProperty(globalThis, "__txStore");
  Reflect.deleteProperty(globalThis, "__accountStore");
  Reflect.deleteProperty(globalThis, "__recurringStore");
});

function balanceOf(accountId: string): number {
  return getAccountsWithBalances().find((a) => a.id === accountId)!.balance;
}

describe("validation (item 2: reject invalid input)", () => {
  it("rejects invalid nominal amounts", () => {
    expect(isPositiveAmount(0)).toBe(false);
    expect(isPositiveAmount(-5)).toBe(false);
    expect(isPositiveAmount(NaN)).toBe(false);
    expect(isPositiveAmount(Infinity)).toBe(false);
    expect(isPositiveAmount(12.5)).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(isValidIsoDate("not-a-date")).toBe(false);
    expect(isValidIsoDate("2026-02-31")).toBe(false); // Feb has no 31st
    expect(isValidIsoDate("2026-13-01")).toBe(false); // month out of range
    expect(isValidIsoDate("2026-06-15")).toBe(true);
  });

  it("rejects an account id that doesn't exist", () => {
    expect(getAccount("does-not-exist")).toBeUndefined();
  });

  it("reports not-found on editing a missing transaction id", () => {
    expect(updateTransaction("missing-id", { merchant: "x" })).toBeUndefined();
  });

  it("reports not-found on deleting a missing transaction id", () => {
    expect(removeTransaction("missing-id")).toBe(false);
  });
});

describe("balance flow (item 3, run in the user's stated order)", () => {
  const accountId = "a1";

  it("add pengeluaran -> saldo turun", () => {
    const startingBalance = balanceOf(accountId);
    const tx = addTransaction({
      merchant: "Test Store",
      category: "Other",
      accountId,
      date: "2026-06-20",
      amount: -100,
    });
    expect(balanceOf(accountId)).toBe(startingBalance - 100);

    // edit -> saldo menyesuaikan
    updateTransaction(tx.id, { amount: -40 });
    expect(balanceOf(accountId)).toBe(startingBalance - 40);

    // rename akun -> saldo tetap
    updateAccount(accountId, { name: "Renamed Checking" });
    expect(balanceOf(accountId)).toBe(startingBalance - 40);

    // hapus transaksi -> saldo kembali
    removeTransaction(tx.id);
    expect(balanceOf(accountId)).toBe(startingBalance);
  });
});
