"use server";

import { addAccount, getAccount, removeAccount, updateAccount } from "./store";
import { ACCOUNT_TYPES, getAccountTypeMeta } from "./types";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";
import { reassignTransactions } from "@/lib/transactions/store";
import { reassignRecurring } from "@/lib/recurring/store";

function buildData(form: FormData, existingBase?: number) {
  const type = enumField(form, "type", ACCOUNT_TYPES.map(t => t.type));
  return {
    name: textField(form, "name"),
    type,
    // An account's starting balance may be negative (e.g. a credit card
    // opened with existing debt) or zero, unlike a transaction amount.
    initialBalance: currencyAmountField(form, { field: "initialBalance", positive: false, existingBase }),
    color: getAccountTypeMeta(type).color,
  };
}
export async function createAccount(form: FormData) {
  return runMutation(() => { addAccount(buildData(form)); revalidateFinancialPages(); });
}
export async function editAccount(form: FormData) {
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getAccount(id);
    if (!existing) throw new ValidationError("Account no longer exists.");
    updateAccount(id, buildData(form, existing.initialBalance));
    revalidateFinancialPages();
  });
}
export async function deleteAccount(form: FormData) {
  return runMutation(() => {
    const id = textField(form, "id");
    if (!getAccount(id)) throw new ValidationError("Account no longer exists.");

    // Optional escape hatch for an account that still has records: move them
    // to another account first, which is exactly what removeAccount's own
    // error message tells the user to do.
    const moveToAccountId = textField(form, "moveToAccountId", false);
    if (moveToAccountId) {
      if (moveToAccountId === id) throw new ValidationError("Choose a different account to move records to.", "moveToAccountId");
      if (!getAccount(moveToAccountId)) throw new ValidationError("The account to move records to does not exist.", "moveToAccountId");
      reassignTransactions(id, moveToAccountId);
      reassignRecurring(id, moveToAccountId);
    }

    if (!removeAccount(id)) throw new ValidationError("Account no longer exists.");
    revalidateFinancialPages();
  });
}
