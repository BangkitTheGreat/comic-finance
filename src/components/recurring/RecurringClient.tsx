"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { RecurringFormModal } from "./RecurringFormModal";
import { deleteRecurring, toggleRecurring } from "@/lib/recurring/actions";
import { getCategoryMeta } from "@/lib/transactions/types";
import { formatMoney, formatMoneyAbs, type Currency } from "@/lib/currency/types";
import type { Recurring } from "@/lib/recurring/types";
import type { AccountOption } from "@/lib/accounts/types";

function formatDue(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function RecurringClient({ recurring, accounts, currency }: { recurring: Recurring[]; accounts: AccountOption[]; currency: Currency }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);

  const monthlyOut = recurring
    .filter((r) => r.active && r.type === "expense" && r.frequency === "monthly")
    .reduce((s, r) => s + r.amount, 0);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: Recurring) => { setEditing(r); setModalOpen(true); };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg font-bold text-ink mb-1">Recurring Transactions</h2>
          <p className="font-body-md text-on-surface-variant">Subscriptions and repeating transactions auto-post when due.</p>
        </div>
        <ComicButton icon="add_circle" onClick={openAdd}>Add Recurring</ComicButton>
      </div>

      <div className="bg-surface-container-lowest border-2 border-border-heavy shadow-comic rounded-xl p-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-pop-purple opacity-20 rounded-full blur-2xl"></div>
        <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2 relative z-10">Monthly Recurring Spend</h3>
        <p className="font-display-numeric text-ink relative z-10">{formatMoney(monthlyOut, currency)}</p>
        <p className="font-caption text-on-surface-variant mt-2 relative z-10">{recurring.filter((r) => r.active).length} active rule{recurring.filter((r) => r.active).length === 1 ? "" : "s"}</p>
      </div>

      {recurring.length === 0 ? (
        <div className="bg-surface border-2 border-border-heavy rounded-xl shadow-comic p-10 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[48px] text-outline">update</span>
          <p className="font-body-md text-on-surface-variant">No recurring transactions yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recurring.map((rec) => {
            const meta = getCategoryMeta(rec.category);
            return (
              <div key={rec.id} className={`bg-surface border-2 border-border-heavy rounded-xl p-4 md:p-5 shadow-comic flex flex-col gap-4 ${rec.active ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border-2 border-border-heavy ${meta.color} flex items-center justify-center shadow-[2px_2px_0px_0px_#111827]`}>
                      <span className="material-symbols-outlined text-ink">{meta.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-headline-md text-ink text-[18px] flex items-center gap-2">
                        {rec.merchant}
                        <span className="bg-surface-container-high px-2 py-0.5 rounded border-2 border-border-heavy font-caption uppercase">{rec.frequency}</span>
                      </h4>
                      <p className="font-caption text-on-surface-variant">Next: {formatDue(rec.nextDue)}{rec.active ? "" : " (paused)"}</p>
                    </div>
                  </div>
                  <div className={`font-headline-md ${rec.type === "income" ? "text-secondary" : "text-danger"}`}>
                    {rec.type === "income" ? "+" : "-"}{formatMoneyAbs(rec.amount, currency)}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2 flex-wrap">
                  <button onClick={() => openEdit(rec)} className="py-1.5 px-3 rounded-lg border-2 border-border-heavy bg-surface font-label-md flex items-center gap-1 comic-interactive shadow-comic-sm">
                    <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                  </button>
                  <ActionForm action={deleteRecurring} confirmation={`Delete "${rec.merchant}"?`}>
                    <input type="hidden" name="id" value={rec.id} />
                    <button type="submit" className="py-1.5 px-3 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container font-label-md flex items-center gap-1 comic-interactive shadow-comic-sm">
                      <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                    </button>
                  </ActionForm>
                  <ActionForm action={toggleRecurring}>
                    <input type="hidden" name="id" value={rec.id} />
                    <input type="hidden" name="active" value={(!rec.active).toString()} />
                    <ComicButton type="submit" variant={rec.active ? "outline" : "primary"} className="py-1.5 px-3" icon={rec.active ? "pause" : "play_arrow"}>
                      {rec.active ? "Pause" : "Resume"}
                    </ComicButton>
                  </ActionForm>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecurringFormModal key={`${modalOpen}-${editing?.id ?? "new"}`} open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} accounts={accounts} currency={currency} />
    </>
  );
}
