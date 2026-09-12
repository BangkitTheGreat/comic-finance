"use client";

import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/action-result";

interface Props {
  action: (form: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
  confirmation?: string;
  disabled?: boolean;
  /** Per-form overrides for the field-name -> label map used in error messages. */
  labels?: Record<string, string>;
}

const defaultLabels: Record<string, string> = {
  merchant: "Name", name: "Account name", amount: "Amount", initialBalance: "Starting balance",
  accountId: "Account", category: "Category", categoryId: "Category", type: "Type", date: "Date", nextDue: "Next due",
  currencyCode: "Currency", frequency: "Frequency", note: "Note", active: "Status", budget: "Monthly limit",
  limit: "Monthly limit", month: "Month", status: "Status", icon: "Icon", color: "Color",
  moveToAccountId: "Move records to",
};

export function ActionForm({ action, children, className, onSuccess, confirmation, disabled = false, labels: overrides }: Props) {
  const labels = overrides ? { ...defaultLabels, ...overrides } : defaultLabels;
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locked = useRef(false);
  const errorId = useId();
  return (
    <form aria-busy={pending} aria-describedby={Object.keys(errors).length ? errorId : undefined}
      onSubmit={event => {
        event.preventDefault();
        if (locked.current || disabled) return;
        if (confirmation && !window.confirm(confirmation)) return;
        const form = new FormData(event.currentTarget);
        locked.current = true;
        setErrors({});
        startTransition(async () => {
          try {
            const result = await action(form);
            if (result.ok) onSuccess?.();
            else setErrors(result.errors);
          } catch {
            setErrors({ form: "Unable to save changes. Please try again." });
          } finally { locked.current = false; }
        });
      }}>
      <fieldset disabled={pending || disabled} className={`min-w-0 border-0 p-0 m-0 ${className ?? ""}`}>
        {children}
      </fieldset>
      {pending && <p role="status" className="font-caption">Saving…</p>}
      {Object.keys(errors).length > 0 && <div id={errorId} role="alert" className="text-danger font-caption mt-2">
        {Object.entries(errors).map(([field, message]) => <p key={field}>{labels[field] ? `${labels[field]}: ` : ""}{message}</p>)}
      </div>}
    </form>
  );
}
