"use client";

import { useEffect, useState } from "react";
import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { editBudgetLimit } from "@/lib/budget/actions";
import { amountInputValue } from "@/lib/currency/input";
import { formatMoney, type Currency } from "@/lib/currency/types";

export interface BudgetCategoryView {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: string;
  color: string;
  progressColor: string;
}

export function BudgetClient({ categories, currency, notifyBudget = true }: { categories: BudgetCategoryView[]; currency: Currency; notifyBudget?: boolean }) {
  const [editing, setEditing] = useState<BudgetCategoryView | null>(null);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setEditing(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => {
          const percent = category.budget > 0 ? Math.min((category.spent / category.budget) * 100, 100) : 0;
          return (
            <ComicCard interactive key={category.id} className="flex flex-col gap-4 relative bg-surface-container-lowest">
              {notifyBudget && percent >= 90 && (
                <div className="absolute -top-6 -right-2 bg-warning border-2 border-border-heavy px-3 py-1 rounded-lg shadow-[2px_2px_0px_0px_#111827] rotate-3 z-10 bubble-tail">
                  <span className="font-bubble-text text-ink text-xs">Woah, slow down!</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${category.color} border-2 border-border-heavy flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-ink">{category.icon}</span>
                  </div>
                  <h4 className="font-headline-md text-ink">{category.name}</h4>
                </div>
                <button onClick={() => setEditing(category)} className="w-8 h-8 rounded-lg border-2 border-border-heavy bg-surface flex items-center justify-center comic-interactive shadow-comic-sm" aria-label={`Edit ${category.name} budget`}>
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </button>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-headline-lg-mobile text-ink">{formatMoney(category.spent, currency)}</span>
                  <span className="font-body-md text-outline">/ {formatMoney(category.budget, currency)}</span>
                </div>
                <div className="w-full h-4 bg-surface-variant border-2 border-border-heavy rounded-full overflow-hidden">
                  <div className={`h-full ${percent >= 90 ? 'bg-warning' : category.progressColor} border-r-2 border-border-heavy transition-all`} style={{ width: `${percent}%`}}></div>
                </div>
              </div>
            </ComicCard>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-border-heavy/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="budget-modal-title" className="relative z-10 w-full max-w-sm bg-surface border-2 border-border-heavy rounded-xl shadow-comic-heavy p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 id="budget-modal-title" className="font-headline-md text-ink">Edit Budget Limit</h3>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full border-2 border-border-heavy bg-surface-container-low flex items-center justify-center comic-interactive shadow-comic-sm" aria-label="Close">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <ActionForm action={editBudgetLimit} onSuccess={() => setEditing(null)} className="flex flex-col gap-4">
              <input type="hidden" name="currencyCode" value={currency.code} />
              <input type="hidden" name="id" value={editing.id} />
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${editing.color} border-2 border-border-heavy flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-ink">{editing.icon}</span>
                </div>
                <span className="font-headline-md text-ink">{editing.name}</span>
              </div>
              <div>
                <label className="block font-label-md mb-2 text-ink">Monthly Limit ({currency.code})</label>
                <input
                  name="budget" type="number"
                  step={currency.fractionDigits === 0 ? "1" : "0.01"}
                  min="0" max="1000000000000" required
                  defaultValue={amountInputValue(editing.budget, currency)}
                  className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
                />
                <p className="font-caption text-on-surface-variant mt-1">Currently spent: {formatMoney(editing.spent, currency)}</p>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <ComicButton type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</ComicButton>
                <ComicButton type="submit" variant="primary" icon="save">Save Limit</ComicButton>
              </div>
            </ActionForm>
          </div>
        </div>
      )}
    </>
  );
}
