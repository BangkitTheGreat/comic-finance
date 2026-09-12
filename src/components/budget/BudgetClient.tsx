"use client";

import { useState } from "react";
import Link from "next/link";
import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { BudgetFormModal } from "./BudgetFormModal";
import { CategoryManagerModal } from "./CategoryManagerModal";
import { copyPreviousMonthBudgets } from "@/lib/budget/actions";
import type { BudgetUsage, UnbudgetedSpending } from "@/lib/budget/usage";
import type { CategoryOption, CategoryWithUsage } from "@/lib/categories/types";
import { formatMoney, type Currency } from "@/lib/currency/types";
import { formatMonthLabel, shiftMonth } from "@/lib/dates";

interface Props {
  month: string;
  budgets: BudgetUsage[];
  unbudgeted: UnbudgetedSpending[];
  categories: CategoryOption[];
  allCategories: CategoryWithUsage[];
  currency: Currency;
  notifyBudget: boolean;
}

type Modal = { kind: "create"; categoryId?: string } | { kind: "edit"; budget: BudgetUsage } | null;

function CopyPreviousMonth({ month }: { month: string }) {
  return (
    <ActionForm action={copyPreviousMonthBudgets} className="inline-block">
      <input type="hidden" name="month" value={month} />
      <ComicButton type="submit" variant="outline" icon="content_copy">Copy {formatMonthLabel(shiftMonth(month, -1))}</ComicButton>
    </ActionForm>
  );
}

export function BudgetClient({ month, budgets, unbudgeted, categories, allCategories, currency, notifyBudget }: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const [categoryManager, setCategoryManager] = useState(false);

  const active = budgets.filter((b) => b.status === "active");
  const totalSpent = active.reduce((s, b) => s + b.spent, 0);
  const totalLimit = active.reduce((s, b) => s + b.limit, 0);
  const totalPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const remaining = totalLimit - totalSpent;
  const monthLabel = formatMonthLabel(month);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline-lg text-on-surface">Monthly Budget</h2>
          <nav aria-label="Budget month" className="mt-2 flex items-center gap-2">
            <Link href={`/budget?month=${shiftMonth(month, -1)}`} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border-heavy bg-surface shadow-comic-sm comic-interactive">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </Link>
            <p className="min-w-[10rem] text-center font-label-md text-on-surface">{monthLabel}</p>
            <Link href={`/budget?month=${shiftMonth(month, 1)}`} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border-heavy bg-surface shadow-comic-sm comic-interactive">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </Link>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="outline" icon="sell" onClick={() => setCategoryManager(true)}>Categories</ComicButton>
          {budgets.length > 0 && <CopyPreviousMonth month={month} />}
          <ComicButton variant="primary" icon="add" onClick={() => setModal({ kind: "create" })}>Add budget</ComicButton>
        </div>
      </div>

      {budgets.length === 0 ? (
        <ComicCard className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline">savings</span>
          <div>
            <h3 className="font-headline-md text-ink">No budgets for {monthLabel} yet</h3>
            <p className="mt-1 max-w-md font-body-md text-on-surface-variant">Set a limit per category to see this month&apos;s spending measured against it.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <ComicButton variant="primary" icon="add" onClick={() => setModal({ kind: "create" })}>Add your first budget</ComicButton>
            <CopyPreviousMonth month={month} />
          </div>
        </ComicCard>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl border-2 border-border-heavy bg-surface-container-lowest p-panel-padding shadow-comic">
            <div className="absolute right-4 top-4 flex h-12 w-12 rotate-12 items-center justify-center rounded-full border-2 border-border-heavy bg-pop-blue shadow-[2px_2px_0px_0px_#111827]">
              <span className="material-symbols-outlined text-border-heavy" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
            </div>
            {/* pr-16 keeps the heading clear of the badge pinned top-right at narrow widths. */}
            <h3 className="mb-2 pr-16 font-label-md uppercase tracking-wider text-on-surface-variant">Total spent · active budgets</h3>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display-numeric text-ink">{formatMoney(totalSpent, currency)}</span>
              <span className="font-headline-md text-outline">/ {formatMoney(totalLimit, currency)}</span>
            </div>
            <div className="relative h-8 w-full overflow-hidden rounded-full border-2 border-border-heavy bg-surface-variant">
              <div className={`absolute left-0 top-0 h-full border-r-2 border-border-heavy transition-all ${totalPercent > 100 ? "bg-danger" : "bg-primary"}`} style={{ width: `${Math.min(totalPercent, 100)}%` }} />
              <div className="absolute inset-0 flex items-center justify-end pr-4 font-caption font-bold text-white mix-blend-difference">
                {Math.round(totalPercent)}% used
              </div>
            </div>
            <p className="mt-3 font-body-md text-on-surface-variant">
              {totalLimit === 0
                ? "All budgets this month are paused."
                : totalSpent === 0
                  ? "Nothing spent against these budgets yet."
                  : remaining >= 0
                    ? <>{formatMoney(remaining, currency)} left across active budgets.</>
                    : <><strong className="text-danger">{formatMoney(Math.abs(remaining), currency)} over</strong> across active budgets.</>}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((b) => {
              const over = b.status === "active" && b.percent > 100;
              const warn = b.status === "active" && b.percent >= 90;
              return (
                <ComicCard key={b.id} className="relative flex flex-col gap-4 bg-surface-container-lowest">
                  {notifyBudget && warn && (
                    <div className="absolute -right-2 -top-6 z-10 rotate-3 rounded-lg border-2 border-border-heavy bg-warning px-3 py-1 shadow-[2px_2px_0px_0px_#111827] bubble-tail">
                      <span className="font-bubble-text text-xs text-ink">{over ? "Over budget!" : "Woah, slow down!"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border-heavy ${b.color}`}>
                      <span className="material-symbols-outlined text-ink">{b.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-headline-md text-ink">{b.categoryName}</h4>
                      {b.status === "paused" && <span className="mt-0.5 inline-block rounded border border-border-heavy bg-surface-container-high px-2 py-0.5 font-caption font-bold text-on-surface-variant">Paused</span>}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-end justify-between gap-2">
                      <span className="font-headline-lg-mobile text-ink">{formatMoney(b.spent, currency)}</span>
                      <span className="font-body-md text-outline">/ {formatMoney(b.limit, currency)}</span>
                    </div>
                    {b.status === "active" ? (
                      <>
                        <div className="h-4 w-full overflow-hidden rounded-full border-2 border-border-heavy bg-surface-variant">
                          <div className={`h-full border-r-2 border-border-heavy transition-all ${over ? "bg-danger" : warn ? "bg-warning" : b.color}`} style={{ width: `${Math.min(b.percent, 100)}%` }} />
                        </div>
                        <p className={`mt-1 font-caption ${over ? "font-bold text-danger" : "text-on-surface-variant"}`}>{Math.round(b.percent)}% used</p>
                      </>
                    ) : (
                      <p className="font-caption text-on-surface-variant">Not counted against your total while paused.</p>
                    )}
                  </div>
                  <ComicButton variant="outline" icon="edit" className="mt-auto w-full" onClick={() => setModal({ kind: "edit", budget: b })} aria-label={`Edit ${b.categoryName} budget`}>
                    Edit budget
                  </ComicButton>
                </ComicCard>
              );
            })}
          </div>
        </>
      )}

      {unbudgeted.length > 0 && (
        <ComicCard>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-headline-md text-ink">Unbudgeted spending</h3>
              <p className="font-caption text-on-surface-variant">Spent in {monthLabel} on categories without a budget.</p>
            </div>
            <span className="font-headline-md text-ink">{formatMoney(unbudgeted.reduce((s, u) => s + u.spent, 0), currency)}</span>
          </div>
          <ul className="divide-y-2 divide-border-heavy/20">
            {unbudgeted.map((u) => (
              <li key={u.categoryName} className="flex items-center gap-3 py-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border-heavy ${u.color}`}>
                  <span className="material-symbols-outlined text-[18px] text-ink">{u.icon}</span>
                </div>
                <span className="min-w-0 flex-1 truncate font-label-md text-ink">{u.categoryName}</span>
                <span className="font-label-md text-ink">{formatMoney(u.spent, currency)}</span>
                {u.categoryId && (
                  <ComicButton variant="outline" icon="add" className="!px-3 !py-1" onClick={() => setModal({ kind: "create", categoryId: u.categoryId })} aria-label={`Add budget for ${u.categoryName}`}>
                    Budget
                  </ComicButton>
                )}
              </li>
            ))}
          </ul>
        </ComicCard>
      )}

      <BudgetFormModal
        open={modal !== null}
        onClose={() => setModal(null)}
        month={month}
        editing={modal?.kind === "edit" ? modal.budget : null}
        prefillCategoryId={modal?.kind === "create" ? modal.categoryId : undefined}
        categories={categories}
        currency={currency}
      />
      <CategoryManagerModal open={categoryManager} onClose={() => setCategoryManager(false)} categories={allCategories} />
    </>
  );
}
