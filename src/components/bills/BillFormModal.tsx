"use client";

import { useEffect } from "react";
import { ComicButton } from "@/components/ui/ComicButton";
import { BILL_ICONS, type Bill } from "@/lib/bills/types";
import { createBill, editBill } from "@/lib/bills/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Bill | null;
}

export function BillFormModal({ open, onClose, editing }: Props) {
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
  const action = isEdit ? editBill : createBill;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-border-heavy/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="bill-modal-title" className="relative z-10 w-full max-w-md bg-surface border-2 border-border-heavy rounded-xl shadow-comic-heavy p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 id="bill-modal-title" className="font-headline-md text-ink">{isEdit ? "Edit Bill" : "Add Bill"}</h3>
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
            <label className="block font-label-md mb-2 text-ink">Bill Name</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={editing?.name ?? ""}
              className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
              placeholder="e.g. Internet"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-label-md mb-2 text-ink">Amount</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editing ? editing.amount : ""}
                className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-label-md mb-2 text-ink">Due Date</label>
              <input
                name="dueDate"
                type="date"
                required
                defaultValue={editing?.dueDate ?? today}
                className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block font-label-md mb-3 text-ink">Pick an Icon</label>
            <div className="flex flex-wrap gap-3">
              {BILL_ICONS.map((icon, i) => (
                <label key={icon} className="cursor-pointer">
                  <input
                    type="radio"
                    name="icon"
                    value={icon}
                    defaultChecked={editing ? editing.icon === icon : i === 0}
                    className="peer sr-only"
                  />
                  <span className="w-11 h-11 rounded-full border-2 border-border-heavy bg-surface-container-low flex items-center justify-center shadow-comic-sm peer-checked:bg-pop-blue peer-checked:ring-4 peer-checked:ring-border-heavy peer-checked:-translate-y-1 transition-all">
                    <span className="material-symbols-outlined text-ink">{icon}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <ComicButton type="button" variant="outline" onClick={onClose}>Cancel</ComicButton>
            <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>
              {isEdit ? "Save Changes" : "Add Bill"}
            </ComicButton>
          </div>
        </form>
      </div>
    </div>
  );
}
