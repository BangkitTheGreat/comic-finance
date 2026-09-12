"use server";

import { addBudget, findBudget, getBudget, listBudgets, removeBudget, updateBudget, type BudgetStatus } from "./store";
import { getCategory } from "@/lib/categories/store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";
import { getWorkspaceId } from "@/lib/workspace/context";
import { isValidIsoMonth, shiftMonth, formatMonthLabel } from "@/lib/dates";
import { withTransaction } from "@/lib/db/client";

const STATUSES: readonly BudgetStatus[] = ["active", "paused"];

function monthField(form: FormData): string {
  const month = textField(form, "month");
  if (!isValidIsoMonth(month)) throw new ValidationError("Choose a valid month.", "month");
  return month;
}

function categoryField(workspaceId: string, form: FormData): string {
  const categoryId = textField(form, "categoryId");
  const category = getCategory(workspaceId, categoryId);
  if (!category || category.archived) throw new ValidationError("Choose an existing category.", "categoryId");
  return categoryId;
}

/** One budget per category per month — the second one is refused, never merged. */
function assertNoDuplicate(workspaceId: string, categoryId: string, month: string, exceptId?: string): void {
  const existing = findBudget(workspaceId, categoryId, month);
  if (existing && existing.id !== exceptId) {
    throw new ValidationError(`This category already has a budget for ${formatMonthLabel(month)}. Edit that one instead.`, "categoryId");
  }
}

export async function createBudget(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const month = monthField(form);
    const categoryId = categoryField(workspaceId, form);
    assertNoDuplicate(workspaceId, categoryId, month);
    // currencyAmountField's default `positive` rejects 0 and negatives: a
    // limit is always > 0, and stopping a budget is the explicit paused status.
    const limit = currencyAmountField(form, { field: "limit" });
    const status = enumField(form, "status", STATUSES);
    addBudget(workspaceId, { categoryId, month, limit, status });
    revalidateFinancialPages();
  });
}

export async function editBudget(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getBudget(workspaceId, id);
    if (!existing) throw new ValidationError("Budget no longer exists.");
    const categoryId = categoryField(workspaceId, form);
    // Month is fixed for the life of a budget: editing September never
    // touches August's row, which keeps history intact.
    assertNoDuplicate(workspaceId, categoryId, existing.month, id);
    const limit = currencyAmountField(form, { field: "limit", existingBase: existing.limit });
    const status = enumField(form, "status", STATUSES);
    updateBudget(workspaceId, id, { categoryId, limit, status });
    revalidateFinancialPages();
  });
}

export async function deleteBudget(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (!removeBudget(workspaceId, textField(form, "id"))) throw new ValidationError("Budget no longer exists.");
    revalidateFinancialPages();
  });
}

/**
 * Copies last month's budgets into `month`, skipping categories that already
 * have one there. Atomic: either every missing budget is created or none.
 */
export async function copyPreviousMonthBudgets(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const month = monthField(form);
    const previous = shiftMonth(month, -1);
    const source = listBudgets(workspaceId, previous);
    if (source.length === 0) throw new ValidationError(`There are no budgets in ${formatMonthLabel(previous)} to copy.`);
    const already = new Set(listBudgets(workspaceId, month).map((b) => b.categoryId));
    const missing = source.filter((b) => !already.has(b.categoryId));
    if (missing.length === 0) throw new ValidationError(`Every budget from ${formatMonthLabel(previous)} already exists in ${formatMonthLabel(month)}.`);
    withTransaction(() => {
      for (const b of missing) addBudget(workspaceId, { categoryId: b.categoryId, month, limit: b.limit, status: b.status });
    });
    revalidateFinancialPages();
  });
}
