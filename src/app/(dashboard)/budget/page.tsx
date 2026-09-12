import { getBudgetUsage } from "@/lib/budget/usage";
import { getCategoryMeta } from "@/lib/transactions/types";
import { BudgetClient } from "@/components/budget/BudgetClient";
import { getActiveCurrency } from "@/lib/currency/store";
import { getSettings } from "@/lib/settings/store";
import { formatMoney } from "@/lib/currency/types";

export default function BudgetPage() {
  const categories = getBudgetUsage().map((c) => ({
    ...c,
    name: c.category,
    icon: getCategoryMeta(c.category).icon,
  }));
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const totalBudget = categories.reduce((s, c) => s + c.budget, 0);
  const totalPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - totalSpent;
  const currency = getActiveCurrency();
  const settings = getSettings();
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-on-surface">Monthly Budget</h2>
          <p className="font-body-md text-on-surface-variant mt-1">{monthLabel} Overview</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border-2 border-border-heavy shadow-comic p-panel-padding rounded-xl relative overflow-hidden">
        <div className="absolute top-4 right-4 bg-pop-blue border-2 border-border-heavy rounded-full w-12 h-12 flex items-center justify-center rotate-12 shadow-[2px_2px_0px_0px_#111827]">
          <span className="material-symbols-outlined text-border-heavy" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
        </div>
        <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Total Spent</h3>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="font-display-numeric text-ink">{formatMoney(totalSpent, currency)}</span>
          <span className="font-headline-md text-outline">/ {formatMoney(totalBudget, currency)}</span>
        </div>
        <div className="relative w-full h-8 bg-surface-variant border-2 border-border-heavy rounded-full overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-primary border-r-2 border-border-heavy transition-all" style={{ width: `${totalPercent}%` }}></div>
          <div className="absolute inset-0 flex items-center justify-end pr-4 font-caption mix-blend-difference text-white font-bold">
            {Math.round(totalPercent)}% Used
          </div>
        </div>
      </div>

      <BudgetClient categories={categories} currency={currency} notifyBudget={settings.notifyBudget} />

      <div className="mt-8 bg-surface-container border-2 border-border-heavy shadow-comic-heavy rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#111827 2px, transparent 2px)", backgroundSize: "16px 16px" }}></div>
        <div className="w-48 h-48 rounded-full border-4 border-border-heavy shadow-comic flex-shrink-0 bg-white overflow-hidden relative">
          <div className="w-full h-full bg-pop-purple opacity-20 absolute top-0 left-0"></div>
          <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] text-ink" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_very_satisfied</span>
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left z-10 bg-white p-6 rounded-xl border-2 border-border-heavy shadow-comic bubble-tail">
          <h3 className="font-headline-lg text-ink mb-2">{remaining >= 0 ? "Look at you go!" : "Over budget!"}</h3>
          <p className="font-body-lg text-on-surface-variant max-w-md">
            {remaining >= 0 ? (
              <>You&apos;re currently tracking <strong>{formatMoney(remaining, currency)} under budget</strong> for this month. Keep up the great work!</>
            ) : (
              <>You&apos;re <strong>{formatMoney(Math.abs(remaining), currency)} over budget</strong> this month. Time to rein it in!</>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
