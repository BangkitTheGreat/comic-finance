import { ComicCard } from "@/components/ui/ComicCard";
import { getDashboardOverview, getRecentTransactions, formatShortDate } from "@/lib/transactions/analytics";
import { getCategoryMeta } from "@/lib/transactions/types";
import { listGoals } from "@/lib/goals/store";
import { listBills } from "@/lib/bills/store";
import { getBillStatus, formatDueLabel } from "@/lib/bills/types";
import { getActiveCurrency } from "@/lib/currency/store";
import { formatMoney } from "@/lib/currency/types";
import { getSettings } from "@/lib/settings/store";
import { getTopBudgetUsage } from "@/lib/budget/usage";
import Link from "next/link";

export default function DashboardPage() {
  const dashboardOverview = getDashboardOverview();
  const recentTransactions = getRecentTransactions(4);
  const savingsGoals = listGoals();
  const upcomingBills = listBills();
  const currency = getActiveCurrency();
  const settings = getSettings();
  const topBudget = getTopBudgetUsage();
  const budgetInsight = topBudget
    ? `Spending on ${topBudget.category} is at ${Math.round(topBudget.percent)}% of budget!`
    : "No budget spending yet this month.";
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center hidden md:flex">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input suppressHydrationWarning className="w-full bg-surface-container-low border-2 border-border-heavy rounded-full py-2 pl-10 pr-4 font-body-md focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_rgba(0,90,182,0.3)] transition-all" placeholder="Search..." type="text" />
        </div>
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

          <ComicCard interactive className="p-5 flex items-center justify-between relative">
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
            {settings.notifyBudget && (
            <div className="absolute -top-12 -left-4 md:-left-16 lg:-left-24 bg-surface border-2 border-border-heavy p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] z-20 max-w-[200px] transform -rotate-3 bubble-tail bubble-tail-white">
              <p className="font-bubble-text text-on-surface">{budgetInsight}</p>
            </div>
            )}
          </ComicCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transactions */}
        <ComicCard className="col-span-1 lg:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-on-surface">Recent Transactions</h3>
            <Link href="/transactions" className="font-label-md text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {recentTransactions.map(tx => {
              const meta = getCategoryMeta(tx.category);
              return (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-surface-container-low rounded-lg transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full border-2 border-border-heavy ${meta.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <span className="material-symbols-outlined text-white">{meta.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-md">{tx.merchant}</p>
                    <p className="font-caption text-on-surface-variant">{tx.category} • {formatShortDate(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-label-md ${tx.amount > 0 ? 'text-secondary' : 'text-on-surface'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount, currency)}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        </ComicCard>

        {/* Goals & Bills */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <ComicCard>
            <h3 className="font-headline-md mb-4">Savings Goals</h3>
            <div className="space-y-5">
              {savingsGoals.map(goal => (
                <div key={goal.id}>
                  <div className="flex justify-between items-end mb-2">
                    <p className="font-label-md flex items-center gap-2">
                      <span className={`material-symbols-outlined text-sm ${goal.color}`}>{goal.icon}</span>
                      {goal.name}
                    </p>
                    <p className="font-caption text-on-surface-variant">{formatMoney(goal.current, currency)} / {formatMoney(goal.target, currency)}</p>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high border-2 border-border-heavy rounded-full overflow-hidden">
                    <div className={`h-full ${goal.bgColor} border-r-2 border-border-heavy`} style={{ width: `${(goal.current/goal.target)*100}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/goals/new" className="block text-center w-full mt-5 py-2 border-2 border-border-heavy rounded text-ink font-label-md bg-white hover:bg-surface-container-low shadow-comic-sm comic-interactive">
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
              {upcomingBills.filter(b => getBillStatus(b) === 'upcoming').map(bill => (
                <div key={bill.id} className="flex items-center justify-between bg-surface-container-low border border-border-heavy rounded p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface border border-border-heavy flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">{bill.icon}</span>
                    </div>
                    <div>
                      <p className="font-label-md leading-tight">{bill.name}</p>
                      <p className="font-caption text-danger leading-tight mt-0.5">Due in {formatDueLabel(bill)}</p>
                    </div>
                  </div>
                  <span className="font-label-md">{formatMoney(bill.amount, currency)}</span>
                </div>
              ))}
            </div>
          </ComicCard>
          )}
        </div>
      </div>
    </>
  );
}
