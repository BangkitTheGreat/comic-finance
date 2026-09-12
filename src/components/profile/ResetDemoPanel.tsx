"use client";

import { useEffect, useId, useRef, useState } from "react";
import { resetDemoData } from "@/lib/profile/actions";
import { useMutationAction } from "./useMutationAction";
import styles from "./profile.module.css";

export function ResetDemoPanel() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const { submit, pending, errors, saved, clear } = useMutationAction(resetDemoData, () => setOpen(false));
  useEffect(() => {
    const node = dialog.current;
    if (open && !node?.open) node?.showModal();
    else if (!open && node?.open) node.close();
    return () => { if (node?.open) node.close(); };
  }, [open]);
  return <section className={styles.dataSection} aria-labelledby={`${id}-heading`}>
    <div className="min-w-0 flex-1">
      <h2 id={`${id}-heading`} className={styles.sectionTitle}>Demo data</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-on-surface-variant">Start over with the sample profile and finances. This replaces changes in the shared demo workspace.</p>
      {saved && <p role="status" className="mt-2 text-sm text-secondary">Demo data reset. The sample profile and finances have been restored.</p>}
    </div>
    <button type="button" className={`${styles.button} ${styles.danger}`} onClick={() => { clear(); setConfirmation(""); setOpen(true); }}>Reset demo data</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={event => { event.preventDefault(); if (!pending) setOpen(false); }}
      onClick={event => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={`${id}-title`} className="text-xl font-bold text-ink">Reset this demo?</h2>
          <button type="button" disabled={pending} aria-label="Close reset confirmation" className={`${styles.button} !p-2`} onClick={() => setOpen(false)}><span aria-hidden="true" className="material-symbols-outlined">close</span></button>
        </div>
        <p id={`${id}-description`} className="text-base leading-relaxed text-on-surface-variant">Your profile, preferences, transactions, accounts, goals, bills, and budgets will return to their sample values. This affects everyone using this demo and cannot be undone.</p>
        <form className="mt-5" aria-busy={pending} onSubmit={event => { event.preventDefault(); submit(new FormData(event.currentTarget)); }}>
          <fieldset disabled={pending} className="m-0 min-w-0 border-0 p-0">
            <label htmlFor={`${id}-confirmation`} className={styles.label}>Type RESET to continue</label>
            <input id={`${id}-confirmation`} name="confirmation" autoComplete="off" required value={confirmation} onChange={event => setConfirmation(event.target.value)} className={styles.input} aria-invalid={!!errors.confirmation} aria-describedby={errors.confirmation ? `${id}-error` : undefined} />
            {errors.confirmation && <p id={`${id}-error`} role="alert" className={styles.error}>{errors.confirmation}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className={styles.button} onClick={() => setOpen(false)}>Keep my changes</button>
              <button type="submit" disabled={confirmation !== "RESET"} className={`${styles.button} ${styles.danger}`}>{pending ? "Resetting…" : "Reset demo data"}</button>
            </div>
          </fieldset>
          {errors.form && <p role="alert" className={styles.error}>{errors.form}</p>}
          {pending && <p role="status" className="mt-3 text-sm">Restoring sample data…</p>}
        </form>
      </div>
    </dialog>
  </section>;
}
