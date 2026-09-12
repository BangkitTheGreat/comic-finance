"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { clearFinancialData, loadSampleData } from "@/lib/workspace/actions";
import type { WorkspaceCounts, WorkspaceStatus } from "@/lib/workspace/types";
import { useMutationAction } from "./useMutationAction";
import styles from "./profile.module.css";

const COUNT_LABELS: [keyof WorkspaceCounts, string][] = [
  ["accounts", "account"],
  ["transactions", "transaction"],
  ["budgets", "budget"],
  ["goals", "goal"],
  ["bills", "bill"],
  ["recurring", "recurring rule"],
];

function plural(n: number, label: string): string {
  return `${n} ${label}${n === 1 ? "" : "s"}`;
}

export function DataWorkspacePanel({ status, counts }: { status: WorkspaceStatus; counts: WorkspaceCounts }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const clearAction = useMutationAction(clearFinancialData, () => setOpen(false));
  const sampleAction = useMutationAction(loadSampleData);
  const totalItems = COUNT_LABELS.reduce((sum, [key]) => sum + counts[key], 0);
  const nonZeroCounts = COUNT_LABELS.filter(([key]) => counts[key] > 0);

  useEffect(() => {
    const node = dialog.current;
    if (open && !node?.open) node?.showModal();
    else if (!open && node?.open) node.close();
    return () => { if (node?.open) node.close(); };
  }, [open]);

  return <section className={styles.dataSection} aria-labelledby={`${id}-heading`}>
    <div className="min-w-0 flex-1">
      <h2 id={`${id}-heading`} className={styles.sectionTitle}>Your data</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-on-surface-variant">
        {status === "empty"
          ? "Your workspace has no financial data yet."
          : `Your workspace has ${plural(totalItems, "item")} across accounts, transactions, budgets, goals, bills and recurring rules.`}
      </p>
      {clearAction.saved && (
        <p role="status" className="mt-3 text-sm text-secondary">
          Financial data cleared. <Link href="/accounts" className="font-semibold underline">Create your first account</Link> to get started.
        </p>
      )}
      {sampleAction.saved && <p role="status" className="mt-3 text-sm text-secondary">Sample data loaded.</p>}
      {sampleAction.errors.form && <p role="alert" className={styles.error}>{sampleAction.errors.form}</p>}
    </div>

    <div className="flex flex-wrap gap-3">
      {status === "empty" && (
        <button
          type="button"
          disabled={sampleAction.pending}
          className={`${styles.button} ${styles.primary}`}
          onClick={() => { clearAction.clear(); sampleAction.submit(new FormData()); }}
        >
          {sampleAction.pending ? "Loading…" : "Load sample data"}
        </button>
      )}
      <button
        type="button"
        disabled={totalItems === 0}
        className={`${styles.button} ${styles.danger}`}
        onClick={() => { sampleAction.clear(); clearAction.clear(); setConfirmation(""); setOpen(true); }}
      >
        Clear financial data
      </button>
    </div>

    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={event => { event.preventDefault(); if (!clearAction.pending) setOpen(false); }}
      onClick={event => { if (event.target === event.currentTarget && !clearAction.pending) setOpen(false); }}
    >
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={`${id}-title`} className="text-xl font-bold text-ink">Clear financial data?</h2>
          <button type="button" disabled={clearAction.pending} aria-label="Close" className={`${styles.button} !p-2`} onClick={() => setOpen(false)}>
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div id={`${id}-description`} className="text-base leading-relaxed text-on-surface-variant">
          <p>This permanently deletes:</p>
          <ul className="mt-2 list-disc pl-5">
            {nonZeroCounts.map(([key, label]) => <li key={key}>{plural(counts[key], label)}</li>)}
          </ul>
          <p className="mt-3">Your profile and preferences are not affected. This cannot be undone.</p>
        </div>
        <form className="mt-5" aria-busy={clearAction.pending} onSubmit={event => { event.preventDefault(); clearAction.submit(new FormData(event.currentTarget)); }}>
          <fieldset disabled={clearAction.pending} className="m-0 min-w-0 border-0 p-0">
            <label htmlFor={`${id}-confirmation`} className={styles.label}>Type CLEAR to continue</label>
            <input
              id={`${id}-confirmation`} name="confirmation" autoComplete="off" required
              value={confirmation} onChange={event => setConfirmation(event.target.value)}
              className={styles.input} aria-invalid={!!clearAction.errors.confirmation}
              aria-describedby={clearAction.errors.confirmation ? `${id}-error` : undefined}
            />
            {clearAction.errors.confirmation && <p id={`${id}-error`} role="alert" className={styles.error}>{clearAction.errors.confirmation}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className={styles.button} onClick={() => setOpen(false)}>Keep my data</button>
              <button type="submit" disabled={confirmation !== "CLEAR"} className={`${styles.button} ${styles.danger}`}>
                {clearAction.pending ? "Clearing…" : "Clear financial data"}
              </button>
            </div>
          </fieldset>
          {clearAction.errors.form && <p role="alert" className={styles.error}>{clearAction.errors.form}</p>}
        </form>
      </div>
    </dialog>
  </section>;
}
