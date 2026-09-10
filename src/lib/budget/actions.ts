"use server";

import { getBudgetCategory, updateBudgetLimit } from "./store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { revalidateFinancialPages } from "@/lib/financial-cache";

export async function editBudgetLimit(form: FormData) {
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getBudgetCategory(id);
    if (!existing) throw new ValidationError("Budget category no longer exists.");
    // A budget limit may be zero (pausing a category) but never negative,
    // unlike an account balance.
    const budget = currencyAmountField(form, { field: "budget", positive: false, existingBase: existing.budget });
    if (budget < 0) throw new ValidationError("Budget limit cannot be negative.", "budget");
    updateBudgetLimit(id, budget);
    revalidateFinancialPages();
  });
}
