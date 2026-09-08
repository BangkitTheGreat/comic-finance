"use client";

import { useEffect, useRef } from "react";
import { ComicButton } from "@/components/ui/ComicButton";
import { CATEGORIES, ACCOUNTS, type Transaction } from "@/lib/transactions/types";
import { createTransaction, editTransaction } from "@/lib/transactions/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Transaction | null;
  accounts?: string[];
}

export function TransactionFormModal({ open, onClose, editing, accounts }: Props) {
  const accountOptions = accounts && accounts.length > 0 ? accounts : ACCOUNTS;
  const formRef = useRef<HTMLFormElement>(null);

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
  const today = new Date().toISOString().slice(0, 10);

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

        <form
          ref={formRef}
          action={async (formData) => {
            await action(formData);
            onClose();
          }}
          className="flex flex-col gap-4"
        >
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
            <label className="block font-label-md mb-2 text-ink">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={editing ? Math.abs(editing.amount) : ""}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="0.00"
            />
          </div>

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
                name="account"
                defaultValue={editing?.account ?? accountOptions[0]}
                className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
              >
                {accountOptions.map((a) => (
                  <option key={a} value={a}>{a}</option>
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
        </form>
      </div>
    </div>
  );
}
