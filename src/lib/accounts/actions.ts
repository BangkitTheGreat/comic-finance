"use server";

import { addAccount, getAccount, removeAccount, updateAccount } from "./store";
import { ACCOUNT_TYPES, getAccountTypeMeta } from "./types";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";
import { reassignTransactions } from "@/lib/transactions/store";
import { reassignRecurring } from "@/lib/recurring/store";
import { getWorkspaceId } from "@/lib/workspace/context";

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
  const workspaceId = await getWorkspaceId();
  return runMutation(() => { addAccount(workspaceId, buildData(form)); revalidateFinancialPages(); });
}
export async function editAccount(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getAccount(workspaceId, id);
    if (!existing) throw new ValidationError("Account no longer exists.");
    updateAccount(workspaceId, id, buildData(form, existing.initialBalance));
    revalidateFinancialPages();
  });
}
export async function deleteAccount(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    if (!getAccount(workspaceId, id)) throw new ValidationError("Account no longer exists.");

    // Optional escape hatch for an account that still has records: move them
    // to another account first, which is exactly what removeAccount's own
    // error message tells the user to do.
    const moveToAccountId = textField(form, "moveToAccountId", false);
    if (moveToAccountId) {
      if (moveToAccountId === id) throw new ValidationError("Choose a different account to move records to.", "moveToAccountId");
      if (!getAccount(workspaceId, moveToAccountId)) throw new ValidationError("The account to move records to does not exist.", "moveToAccountId");
      reassignTransactions(workspaceId, id, moveToAccountId);
      reassignRecurring(workspaceId, id, moveToAccountId);
    }

    if (!removeAccount(workspaceId, id)) throw new ValidationError("Account no longer exists.");
    revalidateFinancialPages();
  });
}
