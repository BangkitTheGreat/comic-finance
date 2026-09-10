export interface BudgetWarningInput {
  name: string;
  spent: number;
  budget: number;
}

export interface BudgetWarning {
  categoryName: string;
  spent: number;
  limit: number;
  /** Percentage of budget used, clamped to 0–100. */
  percent: number;
}

/**
 * Dashboard shows the bubble once a category "nears its limit".
 * Card-level badges in BudgetClient use a stricter 90% threshold;
 * the dashboard bubble is the earlier warning, so it uses 80%.
 */
export const BUDGET_WARNING_THRESHOLD = 80;

export function calcBudgetPercent(spent: number, limit: number): number {
  if (!Number.isFinite(spent) || !Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(Math.max((spent / limit) * 100, 0), 100);
}

/**
 * Returns the highest-percent category at or above `threshold`,
 * or null when nothing needs a warning. Pure function: no I/O,
 * no settings access — the caller gates on `settings.notifyBudget`.
 */
export function getBudgetWarning(
  categories: BudgetWarningInput[],
  threshold: number = BUDGET_WARNING_THRESHOLD,
): BudgetWarning | null {
  let best: BudgetWarning | null = null;
  for (const c of categories) {
    const percent = calcBudgetPercent(c.spent, c.budget);
    if (percent >= threshold && (!best || percent > best.percent)) {
      best = { categoryName: c.name, spent: c.spent, limit: c.budget, percent };
    }
  }
  return best;
}
