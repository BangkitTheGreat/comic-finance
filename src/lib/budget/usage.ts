import { listBudgetCategories, type BudgetCategory } from "./store";
import { getCategorySpending } from "@/lib/transactions/analytics";

export interface BudgetUsage extends BudgetCategory {
  spent: number;
  /** spent / budget as a percentage. Not capped: 130 means 30% over. 0 when the budget is 0. */
  percent: number;
}

/** Every budget category joined with this month's spending. */
export function getBudgetUsage(month?: string): BudgetUsage[] {
  const spending = getCategorySpending(month);
  return listBudgetCategories().map((c) => {
    const spent = spending.get(c.category) ?? 0;
    return { ...c, spent, percent: c.budget > 0 ? (spent / c.budget) * 100 : 0 };
  });
}

/**
 * The category closest to (or furthest past) its limit — what a budget alert
 * should talk about. Ranked by percent, not by amount, so a small budget that
 * is nearly used up outranks a big one that is barely touched.
 * Undefined when nothing has been spent, so callers can say so instead of
 * inventing a number. Paused budgets (limit 0) never raise an alert.
 */
export function getTopBudgetUsage(month?: string): BudgetUsage | undefined {
  return getBudgetUsage(month)
    .filter((u) => u.budget > 0 && u.spent > 0)
    .sort((a, b) => b.percent - a.percent)[0];
}
