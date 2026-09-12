"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicDialog } from "@/components/ui/ComicDialog";
import type { CategoryOption } from "@/lib/categories/types";
import { FREQUENCIES, type Recurring } from "@/lib/recurring/types";
import { createRecurring, editRecurring } from "@/lib/recurring/actions";
import type { AccountOption } from "@/lib/accounts/types";

import { amountInputValue } from "@/lib/currency/input";
import { todayIso } from "@/lib/dates";
import type { Currency } from "@/lib/currency/types";

interface Props {
  currency: Currency;
  open: boolean;
  onClose: () => void;
  editing: Recurring | null;
  accounts: AccountOption[];
  categories: CategoryOption[];
}

export function RecurringFormModal({ open, onClose, editing, accounts, categories, currency }: Props) {
  const [inputCurrency] = useState(currency);
  const step = inputCurrency.fractionDigits === 0 ? "1" : "0.01";
  const displayedAmount = editing ? amountInputValue(editing.amount, inputCurrency) : "";



  const isEdit = editing !== null;
  const action = isEdit ? editRecurring : createRecurring;
  const today = todayIso();

  return (
    <ComicDialog open={open} onClose={onClose} title={isEdit ? "Edit recurring rule" : "Add recurring rule"}>

        {accounts.length === 0 && <p role="status" className="mb-4 font-body-md">Create an account before adding transactions. <a href="/accounts" className="text-primary underline">Manage accounts</a></p>}
        <ActionForm action={action} onSuccess={onClose} disabled={accounts.length === 0} className="flex flex-col gap-4">
          <input type="hidden" name="currencyCode" value={inputCurrency.code} />
          {isEdit && <input type="hidden" name="id" value={editing.id} />}

          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="type" value="expense" defaultChecked={!editing || editing.type === "expense"} className="peer sr-only" />
              <span className="block text-center py-2 rounded-lg border-2 border-border-heavy font-label-md bg-surface peer-checked:bg-error-container peer-checked:text-on-error-container shadow-comic-sm">Expense</span>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" name="type" value="income" defaultChecked={editing?.type === "income"} className="peer sr-only" />
              <span className="block text-center py-2 rounded-lg border-2 border-border-heavy font-label-md bg-surface peer-checked:bg-secondary-container peer-checked:text-on-secondary-container shadow-comic-sm">Income</span>
            </label>
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink">Name</label>
            <input name="merchant" type="text" required defaultValue={editing?.merchant ?? ""} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary" placeholder="e.g. Netflix" />
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink" htmlFor="money-amount">Amount ({inputCurrency.code})</label>
            <input id="money-amount" name="amount" type="number" step={step} min={editing && Number(displayedAmount) === 0 ? "0" : step} max="1000000000000" required defaultValue={displayedAmount} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary" placeholder="0.00" />
          </div>

          <p className="font-caption text-on-surface-variant">Amounts use the app’s fixed exchange rates. Saving the same displayed amount preserves its value.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md mb-2 text-ink">Category</label>
              <select name="categoryId" defaultValue={editing?.categoryId ?? categories[0]?.id} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-label-md mb-2 text-ink">Account</label>
              <select name="accountId" required defaultValue={editing ? (accounts.some(a => a.id === editing.accountId) ? editing.accountId : "") : accounts[0]?.id} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer">
                {editing && !accounts.some(a => a.id === editing.accountId) && <option value="" disabled>Select an existing account</option>}
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <p className="font-caption text-on-surface-variant">Amounts use the app’s fixed exchange rates. Saving the same displayed amount preserves its value.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md mb-2 text-ink">Frequency</label>
              <select name="frequency" defaultValue={editing?.frequency ?? "monthly"} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer">
                {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-label-md mb-2 text-ink">Next Due</label>
              <input name="nextDue" type="date" required defaultValue={editing?.nextDue ?? today} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer" />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <ComicButton type="button" variant="outline" onClick={onClose}>Cancel</ComicButton>
            <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>{isEdit ? "Save Changes" : "Add Recurring"}</ComicButton>
          </div>
        </ActionForm>
    </ComicDialog>
  );
}
