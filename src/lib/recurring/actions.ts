"use server";

import { addRecurring, removeRecurring, updateRecurring, getRecurring } from "./store";
import { FREQUENCIES } from "./types";
import { getCategory } from "@/lib/categories/store";
import { getAccount } from "@/lib/accounts/store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField, dateField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";
import { getWorkspaceId } from "@/lib/workspace/context";

function buildData(workspaceId: string, form: FormData, existingBase?: number) {
  const accountId = textField(form, "accountId");
  if (!getAccount(workspaceId, accountId)) throw new ValidationError("Selected account does not exist.", "accountId");
  const categoryId = textField(form, "categoryId");
  if (!getCategory(workspaceId, categoryId)) throw new ValidationError("Selected category does not exist.", "categoryId");
  return { merchant: textField(form, "merchant"),
    categoryId, accountId,
    type: enumField(form, "type", ["income", "expense"]), amount: currencyAmountField(form, { existingBase }),
    frequency: enumField(form, "frequency", FREQUENCIES.map(f => f.value)),
    nextDue: dateField(form, "nextDue") };
}
export async function createRecurring(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => { addRecurring(workspaceId, { ...buildData(workspaceId, form), active: true }); revalidateFinancialPages(); });
}
export async function editRecurring(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getRecurring(workspaceId, id);
    if (!existing) throw new ValidationError("Recurring rule no longer exists.");
    updateRecurring(workspaceId, id, buildData(workspaceId, form, existing.amount));
    revalidateFinancialPages();
  });
}
export async function toggleRecurring(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const active = enumField(form, "active", ["true", "false"]) === "true";
    const rule = getRecurring(workspaceId, id);
    if (!rule) throw new ValidationError("Recurring rule no longer exists.");
    if (active && !getAccount(workspaceId, rule.accountId)) throw new ValidationError("Choose an existing account before resuming this rule.");
    updateRecurring(workspaceId, id, { active }); revalidateFinancialPages();
  });
}
export async function deleteRecurring(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (!removeRecurring(workspaceId, textField(form, "id"))) throw new ValidationError("Recurring rule no longer exists.");
    revalidateFinancialPages();
  });
}
