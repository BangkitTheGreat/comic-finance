"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicDialog } from "@/components/ui/ComicDialog";
import { ACCOUNT_TYPES, type AccountWithBalance } from "@/lib/accounts/types";
import { createAccount, editAccount } from "@/lib/accounts/actions";
import { amountInputValue } from "@/lib/currency/input";
import type { Currency } from "@/lib/currency/types";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: AccountWithBalance | null;
  currency: Currency;
}

export function AccountFormModal({ open, onClose, editing, currency }: Props) {
  const [inputCurrency] = useState(currency);
  const step = inputCurrency.fractionDigits === 0 ? "1" : "0.01";
  // Signed: unlike a transaction, an account's balance carries its own sign
  // (a credit card can open with existing debt) with no separate income/expense toggle.
  const displayedBalance = editing ? amountInputValue(editing.initialBalance, inputCurrency, { signed: true }) : "0";



  const isEdit = editing !== null;
  const action = isEdit ? editAccount : createAccount;

  return (
    <ComicDialog open={open} onClose={onClose} title={isEdit ? "Edit account" : "Link new account"}>

        <ActionForm
          action={action} onSuccess={onClose}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="currencyCode" value={inputCurrency.code} />
          {isEdit && <input type="hidden" name="id" value={editing.id} />}

          <div>
            <label className="block font-label-md mb-2 text-ink">Account Name</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={editing?.name ?? ""}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="e.g. Main Checking"
            />
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink">Account Type</label>
            <select
              name="type"
              defaultValue={editing?.type ?? ACCOUNT_TYPES[0].type}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-label-md mb-2 text-ink">{isEdit ? "Initial Balance" : "Starting Balance"} ({inputCurrency.code})</label>
            <input
              name="initialBalance"
              type="number"
              step={step}
              max="1000000000000"
              min="-1000000000000"
              defaultValue={displayedBalance}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="0.00"
            />
            {isEdit ? (
              <p className="font-caption text-on-surface-variant mt-1">Transactions adjust this. Editing here changes the opening balance only.</p>
            ) : (
              <p className="font-caption text-on-surface-variant mt-1">Negative is fine for a card with existing debt.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <ComicButton type="button" variant="outline" onClick={onClose}>Cancel</ComicButton>
            <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>
              {isEdit ? "Save Changes" : "Link Account"}
            </ComicButton>
          </div>
        </ActionForm>
    </ComicDialog>
  );
}
