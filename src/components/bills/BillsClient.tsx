"use client";

import { useMemo, useState } from "react";
import { ComicButton } from "@/components/ui/ComicButton";
import { BillFormModal } from "./BillFormModal";
import { deleteBill, payBill, unpayBill } from "@/lib/bills/actions";
import { getBillStatus, formatDueLabel, daysUntil, type Bill } from "@/lib/bills/types";
import { formatMoney, type Currency } from "@/lib/currency/types";

export function BillsClient({ bills, currency }: { bills: Bill[]; currency: Currency }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);

  const summary = useMemo(() => {
    const total = bills.reduce((s, b) => s + b.amount, 0);
    const paidCount = bills.filter((b) => b.paid).length;
    const upcoming7 = bills
      .filter((b) => !b.paid && daysUntil(b.dueDate) >= 0 && daysUntil(b.dueDate) <= 7)
      .reduce((s, b) => s + b.amount, 0);
    const overdueCount = bills.filter((b) => getBillStatus(b) === "overdue").length;
    return { total, paidCount, upcoming7, overdueCount, count: bills.length };
  }, [bills]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (b: Bill) => { setEditing(b); setModalOpen(true); };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-ink mb-1">Bill Reminders</h2>
          <p className="font-body-md text-on-surface-variant">Keep track of your recurring expenses.</p>
        </div>
        <ComicButton icon="add_circle" onClick={openAdd}>Add New Bill</ComicButton>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-surface border-2 border-border-heavy rounded-xl p-6 shadow-comic relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-pop-purple opacity-20 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">Total Bills This Month</h3>
            <div className="bg-surface-variant rounded-full p-2 border-2 border-border-heavy">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
          </div>
          <div className="relative z-10 font-display-numeric text-ink">{formatMoney(summary.total, currency)}</div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            <span className="bg-secondary-container text-on-secondary-container font-caption px-2 py-0.5 rounded border border-border-heavy">{summary.paidCount} Paid</span>
            <span className="text-on-surface-variant font-caption">/ {summary.count} Total</span>
          </div>
        </div>

        <div className="bg-surface border-2 border-border-heavy rounded-xl p-6 shadow-comic relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-warning opacity-20 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="font-label-md text-on-surface-variant uppercase tracking-wider">Upcoming in 7 Days</h3>
            <div className="bg-warning rounded-full p-2 border-2 border-border-heavy">
              <span className="material-symbols-outlined">hourglass_top</span>
            </div>
          </div>
          <div className="relative z-10 font-display-numeric text-ink">{formatMoney(summary.upcoming7, currency)}</div>
          <div className="mt-4 flex items-center gap-2 relative z-10">
            {summary.overdueCount > 0 ? (
              <>
                <span className="bg-error-container text-on-error-container font-caption px-2 py-0.5 rounded border border-border-heavy font-bold">{summary.overdueCount} Overdue</span>
                <span className="text-on-surface-variant font-caption">Needs attention!</span>
              </>
            ) : (
              <span className="bg-secondary-container text-on-secondary-container font-caption px-2 py-0.5 rounded border border-border-heavy">All on track</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4 mt-6">
          <span className="material-symbols-outlined text-warning" style={{fontVariationSettings: "'FILL' 1"}}>pending_actions</span>
          <h3 className="font-headline-md text-ink">All Bills</h3>
        </div>

        {bills.length === 0 ? (
          <div className="bg-surface border-2 border-border-heavy rounded-xl shadow-comic p-10 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-outline">receipt_long</span>
            <p className="font-body-md text-on-surface-variant">No bills yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bills.map((bill) => {
              const status = getBillStatus(bill);
              return (
                <div key={bill.id} className="bg-surface border-2 border-border-heavy rounded-xl p-4 md:p-5 shadow-comic flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full border-2 border-border-heavy flex items-center justify-center shadow-[2px_2px_0px_0px_#111827] ${status === 'overdue' ? 'bg-pop-pink' : status === 'paid' ? 'bg-secondary-container' : 'bg-pop-blue'}`}>
                        <span className="material-symbols-outlined text-ink">{bill.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-headline-md text-ink text-[18px] flex items-center gap-2">
                          {bill.name}
                          {status === 'overdue' && <span className="bg-danger text-white font-caption px-2 py-0.5 rounded border-2 border-border-heavy uppercase -rotate-2 transform">Late</span>}
                          {status === 'paid' && <span className="bg-secondary text-white font-caption px-2 py-0.5 rounded border-2 border-border-heavy uppercase">Paid</span>}
                        </h4>
                        <p className={`font-caption ${status === 'overdue' ? 'text-danger' : status === 'paid' ? 'text-secondary' : 'text-warning font-bold'}`}>
                          {status === 'paid' ? 'Settled' : formatDueLabel(bill)}
                        </p>
                      </div>
                    </div>
                    <div className="font-headline-md text-ink">{formatMoney(bill.amount, currency)}</div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2 flex-wrap">
                    <button onClick={() => openEdit(bill)} className="py-1.5 px-3 rounded-lg border-2 border-border-heavy bg-surface font-label-md flex items-center gap-1 comic-interactive shadow-comic-sm">
                      <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                    </button>
                    <form action={async (fd) => { if (confirm(`Delete "${bill.name}"?`)) await deleteBill(fd); }}>
                      <input type="hidden" name="id" value={bill.id} />
                      <button type="submit" className="py-1.5 px-3 rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container font-label-md flex items-center gap-1 comic-interactive shadow-comic-sm">
                        <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                      </button>
                    </form>
                    {bill.paid ? (
                      <form action={unpayBill}>
                        <input type="hidden" name="id" value={bill.id} />
                        <ComicButton type="submit" variant="outline" className="py-1.5 px-3" icon="undo">Unpay</ComicButton>
                      </form>
                    ) : (
                      <form action={payBill}>
                        <input type="hidden" name="id" value={bill.id} />
                        <ComicButton type="submit" variant="primary" className="py-1.5 px-3" icon="check_circle">Pay Now</ComicButton>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <BillFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </>
  );
}
