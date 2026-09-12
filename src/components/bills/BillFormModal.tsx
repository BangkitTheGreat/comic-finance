"use client";

import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicDialog } from "@/components/ui/ComicDialog";
import { BILL_ICONS, type Bill } from "@/lib/bills/types";
import { createBill, editBill } from "@/lib/bills/actions";
import { amountInputValue } from "@/lib/currency/input";
import type { Currency } from "@/lib/currency/types";
import { todayIso } from "@/lib/dates";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Bill | null;
  currency: Currency;
}

const inputClass = "w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary";

export function BillFormModal({ open, onClose, editing, currency }: Props) {
  const isEdit = editing !== null;
  const step = currency.fractionDigits === 0 ? "1" : "0.01";

  return (
    <ComicDialog open={open} onClose={onClose} title={isEdit ? "Edit bill" : "Add bill"}>
      <ActionForm action={isEdit ? editBill : createBill} onSuccess={onClose} labels={{ name: "Bill name", dueDate: "Due date" }} className="flex flex-col gap-4">
        <input type="hidden" name="currencyCode" value={currency.code} />
        {isEdit && <input type="hidden" name="id" value={editing.id} />}

        <div>
          <label htmlFor="bill-name" className="mb-2 block font-label-md text-ink">Bill name</label>
          <input id="bill-name" name="name" type="text" required maxLength={100} defaultValue={editing?.name ?? ""} placeholder="e.g. Internet" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="bill-amount" className="mb-2 block font-label-md text-ink">Amount ({currency.code})</label>
            <input
              id="bill-amount" name="amount" type="number" inputMode="decimal"
              step={step} min={step} max="1000000000000" required
              defaultValue={isEdit ? amountInputValue(editing.amount, currency) : ""}
              placeholder={currency.fractionDigits === 0 ? "80000" : "79.99"}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="bill-due" className="mb-2 block font-label-md text-ink">Due date</label>
            <input id="bill-due" name="dueDate" type="date" required defaultValue={editing?.dueDate ?? todayIso()} className={`${inputClass} cursor-pointer`} />
          </div>
        </div>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-3 block font-label-md text-ink">Icon</legend>
          <div className="flex flex-wrap gap-2">
            {BILL_ICONS.map((icon, i) => (
              <label key={icon} className="cursor-pointer">
                <input type="radio" name="icon" value={icon} defaultChecked={editing ? editing.icon === icon : i === 0} className="peer sr-only" />
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-border-heavy bg-surface-container-low text-ink shadow-comic-sm transition-all peer-checked:-translate-y-0.5 peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40">
                  <span className="material-symbols-outlined">{icon}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <ComicButton type="button" variant="outline" onClick={onClose}>Cancel</ComicButton>
          <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>{isEdit ? "Save bill" : "Add bill"}</ComicButton>
        </div>
      </ActionForm>
    </ComicDialog>
  );
}
