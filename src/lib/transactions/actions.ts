"use server";

import { addTransaction, removeTransaction, updateTransaction, getTransaction } from "./store";
import { CATEGORY_NAMES } from "./types";
import { getAccount } from "@/lib/accounts/store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField, dateField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";

function buildData(form: FormData, existingBase?: number) {
  const type = enumField(form, "type", ["income", "expense"]);
  const amount = currencyAmountField(form, { existingBase });
  const accountId = textField(form, "accountId");
  if (!getAccount(accountId)) throw new ValidationError("Selected account does not exist.", "accountId");
  return {
    merchant: textField(form, "merchant"),
    category: enumField(form, "category", CATEGORY_NAMES),
    accountId, date: dateField(form, "date"),
    amount: type === "income" ? amount : -amount,
    note: textField(form, "note", false) || undefined,
  };
}
export async function createTransaction(form: FormData) {
  return runMutation(() => { addTransaction(buildData(form)); revalidateFinancialPages(); });
}
export async function editTransaction(form: FormData) {
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getTransaction(id);
    if (!existing) throw new ValidationError("Transaction no longer exists.");
    updateTransaction(id, buildData(form, existing.amount));
    revalidateFinancialPages();
  });
}
export async function deleteTransaction(form: FormData) {
  return runMutation(() => {
    if (!removeTransaction(textField(form, "id"))) throw new ValidationError("Transaction no longer exists.");
    revalidateFinancialPages();
  });
}
