"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComicButton } from "@/components/ui/ComicButton";
import { TransactionFormModal } from "./TransactionFormModal";
import { deleteTransaction } from "@/lib/transactions/actions";
import { ACCOUNTS, getCategoryMeta, type Transaction } from "@/lib/transactions/types";
import { formatMoneyAbs, type Currency } from "@/lib/currency/types";

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  transactions: Transaction[];
  accounts?: string[];
  initialAccount?: string;
  initialQuery?: string;
  initialTransactionId?: string;
  currency: Currency;
}

export function TransactionsClient({
  transactions,
  accounts,
  initialAccount = "all",
  initialQuery = "",
  initialTransactionId = "",
  currency,
}: Props) {
  const router = useRouter();
  const accountOptions = accounts && accounts.length > 0 ? accounts : ACCOUNTS;
  const [query, setQuery] = useState(initialQuery);
  const [account, setAccount] = useState(initialAccount);
  // Deep-link from the dashboard (?transactionId=ID): pre-select the
  // transaction so its edit modal opens on mount. This relies on
  // page.tsx's key={...transactionId...} remounting on navigation —
  // same pattern as initialQuery/initialAccount above.
  // Unknown IDs resolve to null → modal stays closed (graceful).
  const deepLinkedTx =
    initialTransactionId !== ""
      ? (transactions.find((t) => t.id === initialTransactionId) ?? null)
      : null;
  const [modalOpen, setModalOpen] = useState(deepLinkedTx !== null);
  const [editing, setEditing] = useState<Transaction | null>(deepLinkedTx);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesQuery =
        !q ||
        tx.merchant.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.note?.toLowerCase().includes(q) ?? false);
      const matchesAccount = account === "all" || tx.account === account;
      return matchesQuery && matchesAccount;
    });
  }, [transactions, query, account]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
    // Clean the deep-link param so a refresh doesn't reopen the modal.
    // Preserve the search/account filters so Tugas 1 behavior is untouched.
    if (initialTransactionId) {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (account !== "all") params.set("account", account);
      const qs = params.toString();
      router.replace(qs ? `/transactions?${qs}` : "/transactions");
    }
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
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="border-2 border-border-heavy rounded-lg px-4 py-2 font-label-md bg-white focus:border-primary outline-none cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {accountOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
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
                    <p className="font-caption text-on-surface-variant md:hidden">{formatDate(tx.date)} • {tx.account}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 border-2 border-border-heavy rounded-full bg-white font-caption shadow-[2px_2px_0px_0px_#111827]">{tx.category}</span>
                  </div>
                  <div className="hidden md:block font-body-md text-on-surface-variant w-28">{formatDate(tx.date)}</div>
                  <div className="hidden md:block font-body-md text-on-surface-variant w-28">{tx.account}</div>
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
                    <form
                      action={async (fd) => {
                        if (confirm(`Delete "${tx.merchant}"?`)) await deleteTransaction(fd);
                      }}
                    >
                      <input type="hidden" name="id" value={tx.id} />
                      <button
                        type="submit"
                        className="w-8 h-8 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container flex items-center justify-center comic-interactive shadow-comic-sm"
                        aria-label="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </form>
                  </div>
                  <div className="md:hidden flex gap-1 col-span-3 justify-end -mt-2">
                    <button onClick={() => openEdit(tx)} className="px-3 py-1 rounded-lg border-2 border-border-heavy bg-surface font-caption flex items-center gap-1 shadow-comic-sm">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                    </button>
                    <form action={async (fd) => { if (confirm(`Delete "${tx.merchant}"?`)) await deleteTransaction(fd); }}>
                      <input type="hidden" name="id" value={tx.id} />
                      <button type="submit" className="px-3 py-1 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container font-caption flex items-center gap-1 shadow-comic-sm">
                        <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionFormModal open={modalOpen} onClose={closeModal} editing={editing} accounts={accountOptions} />
    </>
  );
}
