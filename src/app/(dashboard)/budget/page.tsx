import { getBudgetUsage, getUnbudgetedSpending } from "@/lib/budget/usage";
import { listCategories, listCategoriesWithUsage } from "@/lib/categories/store";
import { BudgetClient } from "@/components/budget/BudgetClient";
import { getActiveCurrency } from "@/lib/currency/store";
import { getSettings } from "@/lib/settings/store";
import { getWorkspaceId } from "@/lib/workspace/context";
import { currentMonth, isValidIsoMonth } from "@/lib/dates";

export default async function BudgetPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requested } = await searchParams;
  // The month is a URL parameter so it survives reloads and can be linked
  // to; anything malformed falls back to today's month instead of erroring.
  const month = requested && isValidIsoMonth(requested) ? requested : currentMonth();
  const workspaceId = await getWorkspaceId();
  const budgets = getBudgetUsage(workspaceId, month);
  const unbudgeted = getUnbudgetedSpending(workspaceId, month);
  const categories = listCategories(workspaceId).map(({ id, name, icon, color }) => ({ id, name, icon, color }));
  const allCategories = listCategoriesWithUsage(workspaceId);
  const currency = getActiveCurrency(workspaceId);
  const settings = getSettings(workspaceId);
  return (
    <BudgetClient
      month={month}
      budgets={budgets}
      unbudgeted={unbudgeted}
      categories={categories}
      allCategories={allCategories}
      currency={currency}
      notifyBudget={settings.notifyBudget}
    />
  );
}
