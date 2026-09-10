"use client";

import { useEffect, useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { CATEGORIES, type Transaction } from "@/lib/transactions/types";
import { createTransaction, editTransaction } from "@/lib/transactions/actions";
import type { AccountOption } from "@/lib/accounts/types";

import { amountInputValue } from "@/lib/currency/input";
import { todayIso } from "@/lib/dates";
import type { Currency } from "@/lib/currency/types";

interface Props {
  currency: Currency;
  open: boolean;
  onClose: () => void;
  editing: Transaction | null;
  accounts: AccountOption[];
}

export function TransactionFormModal({ open, onClose, editing, accounts, currency }: Props) {

  const [inputCurrency] = useState(currency);
  const step = inputCurrency.fractionDigits === 0 ? "1" : "0.01";
  const displayedAmount = editing ? amountInputValue(editing.amount, inputCurrency) : "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isEdit = editing !== null;
  const action = isEdit ? editTransaction : createTransaction;
  const defaultType = editing && editing.amount > 0 ? "income" : "expense";
  const today = todayIso();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-border-heavy/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" aria-labelledby="tx-modal-title" className="relative z-10 w-full max-w-md bg-surface border-2 border-border-heavy rounded-xl shadow-comic-heavy p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 id="tx-modal-title" className="font-headline-md text-ink">
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border-2 border-border-heavy bg-surface-container-low flex items-center justify-center comic-interactive shadow-comic-sm"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {accounts.length === 0 && <p role="status" className="mb-4 font-body-md">Create an account before adding transactions. <a href="/accounts" className="text-primary underline">Manage accounts</a></p>}
        <ActionForm
          action={action} onSuccess={onClose} disabled={accounts.length === 0}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="currencyCode" value={inputCurrency.code} />
          {isEdit && <input type="hidden" name="id" value={editing.id} />}

          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="expense"
                defaultChecked={defaultType === "expense"}
                className="peer sr-only"
              />
              <span className="block text-center py-2 rounded-lg border-2 border-border-heavy font-label-md bg-surface peer-checked:bg-error-container peer-checked:text-on-error-container shadow-comic-sm">
                Expense
              </span>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="income"
                defaultChecked={defaultType === "income"}
                className="peer sr-only"
              />
              <span className="block text-center py-2 rounded-lg border-2 border-border-heavy font-label-md bg-surface peer-checked:bg-secondary-container peer-checked:text-on-secondary-container shadow-comic-sm">
                Income
              </span>
            </label>
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink">Merchant</label>
            <input
              name="merchant"
              type="text"
              required
              defaultValue={editing?.merchant ?? ""}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="e.g. Joe's Diner"
            />
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink" htmlFor="money-amount">Amount ({inputCurrency.code})</label>
            <input
              id="money-amount" name="amount"
              type="number"
              step={step}
              min={editing && Number(displayedAmount) === 0 ? "0" : step} max="1000000000000"
              required
              defaultValue={displayedAmount}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="0.00"
            />
          </div>

          <p className="font-caption text-on-surface-variant">Amounts use the app’s fixed exchange rates. Saving the same displayed amount preserves its value.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md mb-2 text-ink">Category</label>
              <select
                name="category"
                defaultValue={editing?.category ?? CATEGORIES[0].name}
                className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-label-md mb-2 text-ink">Account</label>
              <select
                name="accountId" required
                defaultValue={editing ? (accounts.some(a => a.id === editing.accountId) ? editing.accountId : "") : accounts[0]?.id}
                className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
              >
                {editing && !accounts.some(a => a.id === editing.accountId) && <option value="" disabled>Select an existing account</option>}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink">Date</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={editing?.date ?? today}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink">Note (optional)</label>
            <input
              name="note"
              type="text"
              defaultValue={editing?.note ?? ""}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="Add a note"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <ComicButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </ComicButton>
            <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>
              {isEdit ? "Save Changes" : "Add Transaction"}
            </ComicButton>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
