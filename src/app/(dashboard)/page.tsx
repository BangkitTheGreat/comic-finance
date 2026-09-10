import { ComicCard } from "@/components/ui/ComicCard";
import { getDashboardOverview, getRecentTransactions, getCategorySpending, formatShortDate } from "@/lib/transactions/analytics";
import { getCategoryMeta } from "@/lib/transactions/types";
import { listBudgetCategories } from "@/lib/budget/store";
import { getBudgetWarning } from "@/lib/budget/insight";
import { BudgetWarningBubble } from "@/components/budget/BudgetWarningBubble";
import { listGoals } from "@/lib/goals/store";
import { listBills } from "@/lib/bills/store";
import { getBillStatus, formatDueLabel } from "@/lib/bills/types";
import { getActiveCurrency } from "@/lib/currency/store";
import { formatMoney } from "@/lib/currency/types";
import { getSettings } from "@/lib/settings/store";
import Link from "next/link";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { buildTransactionDetailUrl } from "@/lib/search/url";

export default function DashboardPage() {
  const dashboardOverview = getDashboardOverview();
  const recentTransactions = getRecentTransactions(4);
  const savingsGoals = listGoals();
  const upcomingBills = listBills();
  const currency = getActiveCurrency();
  const settings = getSettings();
  const upcoming = upcomingBills.filter((b) => getBillStatus(b) === "upcoming");
  const budgetWarning = (() => {
    if (!settings.notifyBudget) return null;
    const spending = getCategorySpending();
    return getBudgetWarning(
      listBudgetCategories().map((c) => ({
        name: c.name,
        spent: spending.get(c.name) ?? 0,
        budget: c.budget,
      })),
    );
  })();
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center hidden md:flex">
        <DashboardSearch />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Balance */}
        <ComicCard className="col-span-1 lg:col-span-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-pop-blue rounded-full opacity-20 blur-2xl"></div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-headline-md text-on-surface-variant flex items-center gap-2">
                  Total Balance
                  <span className="material-symbols-outlined text-primary cursor-help">info</span>
                </h2>
                <div className="mt-2 font-display-numeric tracking-tight text-on-surface">
                  {formatMoney(dashboardOverview.totalBalance, currency)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-border-heavy bg-tertiary-fixed flex items-center justify-center transform rotate-12 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                <span className="material-symbols-outlined text-on-tertiary-fixed font-bold">account_balance</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {dashboardOverview.accounts.map(acc => (
                <div key={acc.name} className="flex items-center gap-2 bg-surface-container border border-border-heavy px-3 py-1.5 rounded-full">
                  <div className={`w-3 h-3 rounded-full ${acc.color}`}></div>
                  <span className="font-label-md">{acc.name}: {formatMoney(acc.balance, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </ComicCard>

        {/* Income / Expense */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <ComicCard interactive className="p-5 flex items-center justify-between">
            <div>
              <p className="font-label-md text-on-surface-variant">Monthly Income</p>
              <p className="font-headline-lg-mobile md:text-headline-lg text-secondary mt-1">
                +{formatMoney(dashboardOverview.monthlyIncome, currency)}
              </p>
            </div>
            <div className="w-10 h-10 rounded border-2 border-border-heavy bg-secondary-container flex items-center justify-center shadow-comic-sm">
              <span className="material-symbols-outlined text-on-secondary-container">trending_up</span>
            </div>
          </ComicCard>

          <ComicCard interactive className="p-5 flex flex-wrap items-center justify-between relative">
            <div>
              <p className="font-label-md text-on-surface-variant">Monthly Expenses</p>
              <p className="font-headline-lg-mobile md:text-headline-lg text-danger mt-1">
                -{formatMoney(dashboardOverview.monthlyExpenses, currency)}
              </p>
            </div>
            <div className="w-10 h-10 rounded border-2 border-border-heavy bg-error-container flex items-center justify-center shadow-comic-sm">
              <span className="material-symbols-outlined text-on-error-container">trending_down</span>
            </div>
            {/* Bubble Insight */}
            {budgetWarning && (
            <BudgetWarningBubble
              categoryName={budgetWarning.categoryName}
              spent={budgetWarning.spent}
              limit={budgetWarning.limit}
              percent={budgetWarning.percent}
              currency={currency}
            />
            )}
          </ComicCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transactions */}
        <ComicCard className="col-span-1 lg:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-on-surface">Recent Transactions</h3>
            <Link href="/transactions" className="font-label-md text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">View All</Link>
          </div>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-outline" aria-hidden="true">receipt_long</span>
                <p className="font-body-md text-on-surface-variant">No transactions yet.</p>
                <Link href="/transactions" className="font-label-md text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  View transactions
                </Link>
              </div>
            ) : (
              recentTransactions.map(tx => {
              const meta = getCategoryMeta(tx.category);
              return (
              <Link
                key={tx.id}
                href={buildTransactionDetailUrl(tx.id)}
                className="flex items-center justify-between gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`View transaction ${tx.merchant}, ${tx.amount > 0 ? '+' : ''}${formatMoney(tx.amount, currency)}`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-12 h-12 shrink-0 rounded-full border-2 border-border-heavy ${meta.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <span className="material-symbols-outlined text-white">{meta.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface truncate" title={tx.merchant}>{tx.merchant}</p>
                    <p className="font-caption text-on-surface-variant truncate">{tx.category} • {formatShortDate(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-label-md ${tx.amount > 0 ? 'text-secondary' : 'text-on-surface'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount, currency)}
                  </p>
                </div>
              </Link>
              );
            }))}
          </div>
        </ComicCard>

        {/* Goals & Bills */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <ComicCard>
            <h3 className="font-headline-md mb-4">Savings Goals</h3>
            {savingsGoals.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-outline" aria-hidden="true">savings</span>
                <p className="font-body-md text-on-surface-variant">No savings goals yet.</p>
              </div>
            ) : (
            <div className="space-y-5">
              {savingsGoals.map(goal => (
                <div key={goal.id}>
                  <div className="flex justify-between items-end gap-3 mb-2">
                    <p className="font-label-md flex items-center gap-2 min-w-0 truncate" title={goal.name}>
                      <span className={`material-symbols-outlined text-sm shrink-0 ${goal.color}`}>{goal.icon}</span>
                      <span className="truncate">{goal.name}</span>
                    </p>
                    <p className="font-caption text-on-surface-variant shrink-0">{formatMoney(goal.current, currency)} / {formatMoney(goal.target, currency)}</p>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high border-2 border-border-heavy rounded-full overflow-hidden">
                    <div className={`h-full ${goal.bgColor} border-r-2 border-border-heavy`} style={{ width: `${(goal.current/goal.target)*100}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
            )}
            <Link href="/goals/new" className="block text-center w-full mt-5 py-2 border-2 border-border-heavy rounded text-ink font-label-md bg-white hover:bg-surface-container-low shadow-comic-sm comic-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              Add New Goal
            </Link>
          </ComicCard>

          {settings.notifyBills && (
          <ComicCard>
            <h3 className="font-headline-md mb-4 flex items-center gap-2">
              Upcoming Bills
              <span className="material-symbols-outlined text-warning">error</span>
            </h3>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[40px] text-outline" aria-hidden="true">receipt_long</span>
                  <p className="font-body-md text-on-surface-variant">No upcoming bills.</p>
                  <Link href="/bills" className="font-label-md text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    View bills
                  </Link>
                </div>
              ) : (
                upcoming.map(bill => (
                <div key={bill.id} className="flex items-center justify-between gap-3 bg-surface-container-low border border-border-heavy rounded p-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 shrink-0 rounded bg-surface border border-border-heavy flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">{bill.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md leading-tight truncate" title={bill.name}>{bill.name}</p>
                      <p className="font-caption text-danger leading-tight mt-0.5">{formatDueLabel(bill)}</p>
                    </div>
                  </div>
                  <span className="font-label-md shrink-0">{formatMoney(bill.amount, currency)}</span>
                </div>
              )))}
            </div>
          </ComicCard>
          )}
        </div>
      </div>
    </>
  );
}
