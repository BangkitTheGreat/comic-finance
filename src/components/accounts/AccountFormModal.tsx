"use client";

import { useEffect } from "react";
import { ComicButton } from "@/components/ui/ComicButton";
import { ACCOUNT_TYPES, type AccountWithBalance } from "@/lib/accounts/types";
import { createAccount, editAccount } from "@/lib/accounts/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: AccountWithBalance | null;
}

export function AccountFormModal({ open, onClose, editing }: Props) {
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
  const action = isEdit ? editAccount : createAccount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-border-heavy/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="account-modal-title" className="relative z-10 w-full max-w-md bg-surface border-2 border-border-heavy rounded-xl shadow-comic-heavy p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 id="account-modal-title" className="font-headline-md text-ink">{isEdit ? "Edit Account" : "Link New Account"}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border-2 border-border-heavy bg-surface-container-low flex items-center justify-center comic-interactive shadow-comic-sm"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form
          action={async (formData) => {
            await action(formData);
            onClose();
          }}
          className="flex flex-col gap-4"
        >
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
            <label className="block font-label-md mb-2 text-ink">{isEdit ? "Initial Balance" : "Starting Balance"}</label>
            <input
              name="initialBalance"
              type="number"
              step="0.01"
              defaultValue={editing ? editing.initialBalance : 0}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="0.00"
            />
            {isEdit && (
              <p className="font-caption text-on-surface-variant mt-1">Transactions adjust this. Editing here changes the opening balance only.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <ComicButton type="button" variant="outline" onClick={onClose}>Cancel</ComicButton>
            <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>
              {isEdit ? "Save Changes" : "Link Account"}
            </ComicButton>
          </div>
        </form>
      </div>
    </div>
  );
}
