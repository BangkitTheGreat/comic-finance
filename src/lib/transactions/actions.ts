"use server";

import { addTransaction, removeTransaction, updateTransaction, getTransaction } from "./store";
import { getAccount } from "@/lib/accounts/store";
import { getCategory } from "@/lib/categories/store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField, dateField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";
import { getWorkspaceId } from "@/lib/workspace/context";

function buildData(workspaceId: string, form: FormData, existingBase?: number) {
  const type = enumField(form, "type", ["income", "expense"]);
  const amount = currencyAmountField(form, { existingBase });
  const accountId = textField(form, "accountId");
  if (!getAccount(workspaceId, accountId)) throw new ValidationError("Selected account does not exist.", "accountId");
  const categoryId = textField(form, "categoryId");
  if (!getCategory(workspaceId, categoryId)) throw new ValidationError("Selected category does not exist.", "categoryId");
  return {
    merchant: textField(form, "merchant"),
    categoryId,
    accountId, date: dateField(form, "date"),
    amount: type === "income" ? amount : -amount,
    note: textField(form, "note", false) || undefined,
  };
}
export async function createTransaction(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => { addTransaction(workspaceId, buildData(workspaceId, form)); revalidateFinancialPages(); });
}
export async function editTransaction(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getTransaction(workspaceId, id);
    if (!existing) throw new ValidationError("Transaction no longer exists.");
    updateTransaction(workspaceId, id, buildData(workspaceId, form, existing.amount));
    revalidateFinancialPages();
  });
}
export async function deleteTransaction(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (!removeTransaction(workspaceId, textField(form, "id"))) throw new ValidationError("Transaction no longer exists.");
    revalidateFinancialPages();
  });
}
