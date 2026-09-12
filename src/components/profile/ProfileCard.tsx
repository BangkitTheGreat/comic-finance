"use client";

import { useEffect, useId, useRef, useState } from "react";
import { editProfile } from "@/lib/profile/actions";
import type { UserProfile } from "@/lib/profile/store";
import { Avatar } from "./Avatar";
import { useMutationAction } from "./useMutationAction";
import styles from "./profile.module.css";

export function ProfileCard({ profile }: { profile: UserProfile }) {
  const [editing, setEditing] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const { submit, pending, errors, saved, clear } = useMutationAction(editProfile, () => {
    setEditing(false); requestAnimationFrame(() => editButton.current?.focus());
  });
  useEffect(() => { if (editing) nameInput.current?.focus(); }, [editing]);
  useEffect(() => {
    const field = Object.keys(errors)[0];
    if (field) document.getElementById(`${id}-${field}`)?.focus();
  }, [errors, id]);
  return <section className={styles.panel} aria-labelledby={`${id}-heading`}>
    <div className={styles.profileBanner}><h2 id={`${id}-heading`} className={styles.sectionTitle}>Your profile</h2><span aria-hidden="true" className="material-symbols-outlined text-2xl">face</span></div>
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-5 lg:flex-col lg:items-start">
        <Avatar name={profile.name} size="large" />
        <div className="min-w-0">
          <p className="text-xl font-bold text-ink [overflow-wrap:anywhere]"><bdi>{profile.name}</bdi></p>
          <p className="mt-1 text-sm text-on-surface-variant [overflow-wrap:anywhere]"><bdi>{profile.email}</bdi></p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">Your name and initials appear throughout PennyComic.</p>
      {!editing && <button ref={editButton} type="button" className={`${styles.button} ${styles.primary} mt-5 w-full`} onClick={() => { clear(); setEditing(true); }}><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>Edit profile</button>}
      <p role="status" className="mt-3 text-sm text-secondary">{saved && !editing ? "Profile updated." : ""}</p>
      {editing && <form className="mt-5" aria-busy={pending} onSubmit={event => { event.preventDefault(); submit(new FormData(event.currentTarget)); }}>
        <fieldset disabled={pending} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div>
            <label htmlFor={`${id}-name`} className={styles.label}>Full name</label>
            <input ref={nameInput} id={`${id}-name`} name="name" autoComplete="name" required maxLength={80} defaultValue={profile.name} className={styles.input} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
            {errors.name && <p id={`${id}-name-error`} role="alert" className={styles.error}>{errors.name}</p>}
          </div>
          <div>
            <label htmlFor={`${id}-email`} className={styles.label}>Email</label>
            <input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={profile.email} className={styles.input} aria-invalid={!!errors.email} aria-describedby={`${id}-email-help${errors.email ? ` ${id}-email-error` : ""}`} />
            <p id={`${id}-email-help`} className="mt-2 text-sm text-on-surface-variant">Used for this demo profile, not for signing in.</p>
            {errors.email && <p id={`${id}-email-error`} role="alert" className={styles.error}>{errors.email}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={`${styles.button} ${styles.primary}`}>{pending ? "Saving…" : "Save changes"}</button>
            <button type="button" className={styles.button} onClick={() => { clear(); setEditing(false); requestAnimationFrame(() => editButton.current?.focus()); }}>Cancel</button>
          </div>
        </fieldset>
        {errors.form && <p role="alert" className={styles.error}>{errors.form}</p>}
        {pending && <p role="status" className="mt-2 text-sm">Saving your profile…</p>}
      </form>}
    </div>
  </section>;
}
