"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicDialog } from "@/components/ui/ComicDialog";
import { AccountFormModal } from "./AccountFormModal";
import { deleteAccount } from "@/lib/accounts/actions";
import { getAccountTypeMeta, type AccountWithBalance } from "@/lib/accounts/types";
import { formatMoneyAbs, type Currency } from "@/lib/currency/types";
import Link from "next/link";

function usageLabel(account: AccountWithBalance): string {
  const parts: string[] = [];
  if (account.transactionCount > 0) parts.push(`${account.transactionCount} transaction${account.transactionCount === 1 ? "" : "s"}`);
  if (account.recurringCount > 0) parts.push(`${account.recurringCount} recurring rule${account.recurringCount === 1 ? "" : "s"}`);
  return parts.join(" and ");
}

export function AccountsClient({ accounts, currency }: { accounts: AccountWithBalance[]; currency: Currency }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AccountWithBalance | null>(null);
  const [moving, setMoving] = useState<AccountWithBalance | null>(null);

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (a: AccountWithBalance) => { setEditing(a); setModalOpen(true); };
  const isInUse = (a: AccountWithBalance) => a.transactionCount > 0 || a.recurringCount > 0;
  const moveTargets = moving ? accounts.filter((a) => a.id !== moving.id) : [];

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-ink mb-1">Accounts</h2>
          <p className="font-body-md text-on-surface-variant">Manage your linked accounts and wallets.</p>
        </div>
        <ComicButton icon="add" onClick={openAdd}>Link New Account</ComicButton>
      </div>

      <div className="bg-surface-container-lowest border-2 border-border-heavy shadow-comic rounded-xl p-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-pop-blue opacity-20 rounded-full blur-2xl"></div>
        <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2 relative z-10">Net Worth</h3>
        <p className="font-display-numeric text-ink relative z-10">{total < 0 ? "-" : ""}{formatMoneyAbs(total, currency)}</p>
        <p className="font-caption text-on-surface-variant mt-2 relative z-10">Across {accounts.length} account{accounts.length === 1 ? "" : "s"}</p>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-surface border-2 border-border-heavy rounded-xl shadow-comic p-10 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[48px] text-outline">account_balance_wallet</span>
          <p className="font-body-md text-on-surface-variant">No accounts yet. Link your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const meta = getAccountTypeMeta(acc.type);
            return (
              <div key={acc.id} className="bg-surface border-2 border-border-heavy rounded-xl p-6 shadow-comic flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-full border-2 border-border-heavy ${acc.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-ink">{meta.icon}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(acc)} className="w-8 h-8 rounded-lg border-2 border-border-heavy bg-surface flex items-center justify-center comic-interactive shadow-comic-sm" aria-label={`Edit ${acc.name}`}>
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    {isInUse(acc) ? (
                      <button
                        onClick={() => setMoving(acc)}
                        className="w-8 h-8 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container flex items-center justify-center comic-interactive shadow-comic-sm"
                        aria-label={`Delete ${acc.name}, which still has ${usageLabel(acc)}`}
                        title={`Still has ${usageLabel(acc)} — they must be moved first`}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    ) : (
                      <ActionForm action={deleteAccount} confirmation={`Delete "${acc.name}"?`}>
                        <input type="hidden" name="id" value={acc.id} />
                        <button type="submit" className="w-8 h-8 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container flex items-center justify-center comic-interactive shadow-comic-sm" aria-label={`Delete ${acc.name}`}>
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </ActionForm>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-label-md text-on-surface-variant uppercase tracking-wider">{acc.name}</p>
                  <p className="font-caption text-outline">{meta.label}</p>
                  <p className={`font-headline-lg-mobile mt-1 ${acc.balance < 0 ? "text-danger" : "text-ink"}`}>
                    {acc.balance < 0 ? "-" : ""}{formatMoneyAbs(acc.balance, currency)}
                  </p>
                </div>
                <div className="border-t-2 border-border-heavy pt-4 mt-auto">
                  <Link href={`/transactions?accountId=${encodeURIComponent(acc.id)}`} className="text-primary font-label-md hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    View History
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {moving && (
        <ComicDialog open onClose={() => setMoving(null)} title={`Delete ${moving.name}`}>

            {moveTargets.length === 0 ? (
              <>
                <p className="font-body-md text-on-surface-variant">
                  This account still has {usageLabel(moving)}, and it is your only account, so there is nowhere to move them.
                  Create another account first.
                </p>
                <div className="flex justify-end mt-4">
                  <ComicButton type="button" variant="outline" onClick={() => setMoving(null)}>Close</ComicButton>
                </div>
              </>
            ) : (
              <ActionForm
                action={deleteAccount}
                onSuccess={() => setMoving(null)}
                confirmation={`Move ${usageLabel(moving)} off "${moving.name}" and delete it?`}
                className="flex flex-col gap-4"
              >
                <input type="hidden" name="id" value={moving.id} />
                <p className="font-body-md text-on-surface-variant">
                  This account still has {usageLabel(moving)}. Deleting it moves them to another account, so no history is lost.
                </p>
                <div>
                  <label htmlFor="move-target" className="block font-label-md mb-2 text-ink">Move records to</label>
                  <select
                    id="move-target" name="moveToAccountId" required defaultValue={moveTargets[0]?.id}
                    className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {moveTargets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <p className="font-caption text-on-surface-variant mt-1">Their balance moves with them.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <ComicButton type="button" variant="outline" onClick={() => setMoving(null)}>Cancel</ComicButton>
                  <ComicButton type="submit" variant="primary" icon="delete">Move and Delete</ComicButton>
                </div>
              </ActionForm>
            )}
        </ComicDialog>
      )}

      <AccountFormModal key={`${modalOpen}-${editing?.id ?? "new"}`} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} currency={currency} />
    </>
  );
}
