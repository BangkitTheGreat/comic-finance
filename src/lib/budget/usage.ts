import { listBudgets, type Budget } from "./store";
import { listCategories } from "@/lib/categories/store";
import { getCategorySpending } from "@/lib/transactions/analytics";
import { currentMonth } from "@/lib/dates";

export interface BudgetUsage extends Budget {
  categoryName: string;
  icon: string;
  color: string;
  spent: number;
  /** spent / limit as a percentage. Not capped: 130 means 30% over. 0 while paused. */
  percent: number;
}

export interface UnbudgetedSpending {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  spent: number;
}

const UNKNOWN = { name: "Unknown category", icon: "help", color: "bg-surface-variant" };

/** Every budget for `month` joined with its category and that month's spending. */
export function getBudgetUsage(workspaceId: string, month: string = currentMonth()): BudgetUsage[] {
  // Both sides are keyed by category id, so a rename cannot separate a
  // budget from the spending it measures.
  const spending = getCategorySpending(workspaceId, month);
  const categories = new Map(listCategories(workspaceId, { includeArchived: true }).map((c) => [c.id, c]));
  return listBudgets(workspaceId, month).map((b) => {
    const meta = categories.get(b.categoryId) ?? UNKNOWN;
    const spent = spending.get(b.categoryId) ?? 0;
    return {
      ...b,
      categoryName: meta.name,
      icon: meta.icon,
      color: meta.color,
      spent,
      percent: b.status === "active" ? (spent / b.limit) * 100 : 0,
    };
  });
}

/**
 * The active budget closest to (or furthest past) its limit — what a budget
 * alert should talk about. Ranked by percent, not amount, so a small budget
 * that is nearly used up outranks a big one barely touched. Undefined when
 * nothing has been spent, so callers say so instead of inventing a number.
 * Paused budgets never raise an alert.
 */
export function getTopBudgetUsage(workspaceId: string, month?: string): BudgetUsage | undefined {
  return getBudgetUsage(workspaceId, month)
    .filter((u) => u.status === "active" && u.spent > 0)
    .sort((a, b) => b.percent - a.percent)[0];
}

/** Spending in categories that have no budget row at all for `month` (active or paused). */
export function getUnbudgetedSpending(workspaceId: string, month: string = currentMonth()): UnbudgetedSpending[] {
  const budgeted = new Set(listBudgets(workspaceId, month).map((b) => b.categoryId));
  const categories = new Map(listCategories(workspaceId, { includeArchived: true }).map((c) => [c.id, c]));
  const rows: UnbudgetedSpending[] = [];
  for (const [categoryId, spent] of getCategorySpending(workspaceId, month)) {
    if (budgeted.has(categoryId)) continue;
    const meta = categories.get(categoryId) ?? UNKNOWN;
    rows.push({ categoryId, categoryName: meta.name, icon: meta.icon, color: meta.color, spent });
  }
  return rows.sort((a, b) => b.spent - a.spent);
}
