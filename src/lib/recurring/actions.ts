"use server";

import { addRecurring, removeRecurring, updateRecurring, getRecurring } from "./store";
import { FREQUENCIES } from "./types";
import { CATEGORY_NAMES } from "@/lib/transactions/types";
import { getAccount } from "@/lib/accounts/store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField, dateField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";

function buildData(form: FormData, existingBase?: number) {
  const accountId = textField(form, "accountId");
  if (!getAccount(accountId)) throw new ValidationError("Selected account does not exist.", "accountId");
  return { merchant: textField(form, "merchant"),
    category: enumField(form, "category", CATEGORY_NAMES), accountId,
    type: enumField(form, "type", ["income", "expense"]), amount: currencyAmountField(form, { existingBase }),
    frequency: enumField(form, "frequency", FREQUENCIES.map(f => f.value)),
    nextDue: dateField(form, "nextDue") };
}
export async function createRecurring(form: FormData) {
  return runMutation(() => { addRecurring({ ...buildData(form), active: true }); revalidateFinancialPages(); });
}
export async function editRecurring(form: FormData) {
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getRecurring(id);
    if (!existing) throw new ValidationError("Recurring rule no longer exists.");
    updateRecurring(id, buildData(form, existing.amount));
    revalidateFinancialPages();
  });
}
export async function toggleRecurring(form: FormData) {
  return runMutation(() => {
    const id = textField(form, "id");
    const active = enumField(form, "active", ["true", "false"]) === "true";
    const rule = getRecurring(id);
    if (!rule) throw new ValidationError("Recurring rule no longer exists.");
    if (active && !getAccount(rule.accountId)) throw new ValidationError("Choose an existing account before resuming this rule.");
    updateRecurring(id, { active }); revalidateFinancialPages();
  });
}
export async function deleteRecurring(form: FormData) {
  return runMutation(() => {
    if (!removeRecurring(textField(form, "id"))) throw new ValidationError("Recurring rule no longer exists.");
    revalidateFinancialPages();
  });
}
