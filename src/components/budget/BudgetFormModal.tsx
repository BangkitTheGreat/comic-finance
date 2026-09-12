"use client";

import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicDialog } from "@/components/ui/ComicDialog";
import { createBudget, deleteBudget, editBudget } from "@/lib/budget/actions";
import type { BudgetUsage } from "@/lib/budget/usage";
import type { CategoryOption } from "@/lib/categories/types";
import { amountInputValue } from "@/lib/currency/input";
import { formatMoney, type Currency } from "@/lib/currency/types";
import { formatMonthLabel } from "@/lib/dates";

interface Props {
  open: boolean;
  onClose: () => void;
  month: string;
  editing: BudgetUsage | null;
  /** Pre-selects a category when opened from an "Unbudgeted spending" row. */
  prefillCategoryId?: string;
  categories: CategoryOption[];
  currency: Currency;
}

const inputClass = "w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary";

export function BudgetFormModal({ open, onClose, month, editing, prefillCategoryId, categories, currency }: Props) {
  const isEdit = editing !== null;
  const step = currency.fractionDigits === 0 ? "1" : "0.01";
  const min = currency.fractionDigits === 0 ? "1" : "0.01";
  const defaultCategory = editing?.categoryId ?? prefillCategoryId ?? categories[0]?.id ?? "";

  return (
    <ComicDialog open={open} onClose={onClose} title={isEdit ? "Edit budget" : `Add budget for ${formatMonthLabel(month)}`}>
      <ActionForm action={isEdit ? editBudget : createBudget} onSuccess={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="currencyCode" value={currency.code} />
        <input type="hidden" name="month" value={month} />
        {isEdit && <input type="hidden" name="id" value={editing.id} />}

        <div>
          <label htmlFor="budget-category" className="mb-2 block font-label-md text-ink">Category</label>
          <select id="budget-category" name="categoryId" defaultValue={defaultCategory} required className={`${inputClass} cursor-pointer`}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {isEdit && <p className="mt-1 font-caption text-on-surface-variant">This budget stays in {formatMonthLabel(editing.month)}. Other months keep their own limits.</p>}
        </div>

        <div>
          <label htmlFor="budget-limit" className="mb-2 block font-label-md text-ink">Monthly limit ({currency.code})</label>
          <input
            id="budget-limit" name="limit" type="number" inputMode="decimal"
            step={step} min={min} max="1000000000000" required
            defaultValue={isEdit ? amountInputValue(editing.limit, currency) : ""}
            placeholder={currency.fractionDigits === 0 ? "500000" : "500.00"}
            className={inputClass}
          />
          <p className="mt-1 font-caption text-on-surface-variant">
            {isEdit
              ? <>Spent so far: {formatMoney(editing.spent, currency)}. Spending comes from transactions; edit those to change it.</>
              : <>Must be greater than zero. To stop a budget, pause it instead of setting zero.</>}
          </p>
        </div>

        <div>
          <label htmlFor="budget-status" className="mb-2 block font-label-md text-ink">Status</label>
          <select id="budget-status" name="status" defaultValue={editing?.status ?? "active"} className={`${inputClass} cursor-pointer`}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <ComicButton type="button" variant="outline" onClick={onClose}>Cancel</ComicButton>
          <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>{isEdit ? "Save budget" : "Add budget"}</ComicButton>
        </div>
      </ActionForm>

      {isEdit && (
        <ActionForm
          action={deleteBudget}
          onSuccess={onClose}
          confirmation={`Delete the ${editing.categoryName} budget for ${formatMonthLabel(editing.month)}? Transactions in this category are kept.`}
          className="mt-6 border-t-2 border-border-heavy pt-4"
        >
          <input type="hidden" name="id" value={editing.id} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-caption text-on-surface-variant">Removes only this month&apos;s allocation.</p>
            <ComicButton type="submit" variant="danger" icon="delete">Delete budget</ComicButton>
          </div>
        </ActionForm>
      )}
    </ComicDialog>
  );
}
