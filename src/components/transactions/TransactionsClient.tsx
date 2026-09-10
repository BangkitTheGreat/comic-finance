"use client";

import { useMemo, useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { TransactionFormModal } from "./TransactionFormModal";
import { deleteTransaction } from "@/lib/transactions/actions";
import { getCategoryMeta, type Transaction } from "@/lib/transactions/types";
import { formatMoneyAbs, type Currency } from "@/lib/currency/types";
import type { AccountOption } from "@/lib/accounts/types";

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  transactions: Transaction[];
  accounts: AccountOption[];
  initialAccountId?: string;
  currency: Currency;
}

export function TransactionsClient({ transactions, accounts, initialAccountId = "all", currency }: Props) {
  const [query, setQuery] = useState("");
  const [accountId, setAccountId] = useState(initialAccountId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const accountNameById = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesQuery =
        !q ||
        tx.merchant.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.note?.toLowerCase().includes(q) ?? false);
      const matchesAccount = accountId === "all" || tx.accountId === accountId;
      return matchesQuery && matchesAccount;
    });
  }, [transactions, query, accountId]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg font-bold text-ink mb-1">Transaction History</h2>
          <p className="font-body-md text-on-surface-variant">Track where your money goes.</p>
        </div>
        <ComicButton icon="add" onClick={openAdd}>Add Transaction</ComicButton>
      </div>

      <div className="bg-surface border-2 border-border-heavy rounded-xl p-6 shadow-comic flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-border-heavy rounded-lg font-body-md focus:border-primary focus:ring-0 outline-none transition-colors bg-surface"
            placeholder="Search transactions..."
            type="text"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="border-2 border-border-heavy rounded-lg px-4 py-2 font-label-md bg-white focus:border-primary outline-none cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface border-2 border-border-heavy rounded-xl shadow-comic overflow-hidden">
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-4 border-b-2 border-border-heavy bg-surface-container-low font-label-md text-on-surface-variant">
          <div className="w-12 text-center">Cat</div>
          <div>Description</div>
          <div className="w-28">Date</div>
          <div className="w-28">Account</div>
          <div className="w-28 text-right">Amount</div>
          <div className="w-20 text-center">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-outline">receipt_long</span>
            <p className="font-body-md text-on-surface-variant">
              {transactions.length === 0 ? "No transactions yet. Add your first one!" : "No transactions match your filters."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((tx) => {
              const meta = getCategoryMeta(tx.category);
              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-4 border-b-2 border-border-heavy hover:bg-surface-container-lowest transition-colors items-center"
                >
                  <div className={`w-12 h-12 rounded-full border-2 border-border-heavy ${meta.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-ink">{meta.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-body-md font-bold text-ink">{tx.merchant}</h3>
                    <p className="font-caption text-on-surface-variant md:hidden">{formatDate(tx.date)} • {accountNameById.get(tx.accountId) ?? "Unknown"}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 border-2 border-border-heavy rounded-full bg-white font-caption shadow-[2px_2px_0px_0px_#111827]">{tx.category}</span>
                  </div>
                  <div className="hidden md:block font-body-md text-on-surface-variant w-28">{formatDate(tx.date)}</div>
                  <div className="hidden md:block font-body-md text-on-surface-variant w-28">{accountNameById.get(tx.accountId) ?? "Unknown"}</div>
                  <div className="text-right w-28">
                    <div className={`font-headline-md font-bold ${tx.amount > 0 ? "text-secondary" : "text-danger"}`}>
                      {tx.amount > 0 ? "+" : "-"}{formatMoneyAbs(tx.amount, currency)}
                    </div>
                  </div>
                  <div className="hidden md:flex w-20 justify-center gap-1">
                    <button
                      onClick={() => openEdit(tx)}
                      className="w-8 h-8 rounded-lg border-2 border-border-heavy bg-surface flex items-center justify-center comic-interactive shadow-comic-sm"
                      aria-label="Edit"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <ActionForm
                      action={deleteTransaction} confirmation={`Delete "${tx.merchant}"?`}
                    >
                      <input type="hidden" name="id" value={tx.id} />
                      <button
                        type="submit"
                        className="w-8 h-8 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container flex items-center justify-center comic-interactive shadow-comic-sm"
                        aria-label="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </ActionForm>
                  </div>
                  <div className="md:hidden flex gap-1 col-span-3 justify-end -mt-2">
                    <button onClick={() => openEdit(tx)} className="px-3 py-1 rounded-lg border-2 border-border-heavy bg-surface font-caption flex items-center gap-1 shadow-comic-sm">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                    </button>
                    <ActionForm action={deleteTransaction} confirmation={`Delete "${tx.merchant}"?`}>
                      <input type="hidden" name="id" value={tx.id} />
                      <button type="submit" className="px-3 py-1 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container font-caption flex items-center gap-1 shadow-comic-sm">
                        <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                      </button>
                    </ActionForm>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionFormModal key={`${modalOpen}-${editing?.id ?? "new"}`} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} accounts={accounts} currency={currency} />
    </>
  );
}
