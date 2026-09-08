"use client";

import { useEffect, useState } from "react";
import { ComicCard } from "@/components/ui/ComicCard";
import { ComicButton } from "@/components/ui/ComicButton";
import { editProfile } from "@/lib/profile/actions";
import type { UserProfile } from "@/lib/profile/store";

export function ProfileCard({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <ComicCard className="flex flex-col items-center text-center relative overflow-hidden pt-10 pb-8">
      <div className="absolute top-0 left-0 w-full h-24 bg-pop-purple border-b-2 border-border-heavy"></div>

      <div className="relative z-10 w-24 h-24 rounded-full border-4 border-border-heavy shadow-comic bg-surface overflow-hidden mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.avatar} alt={`${profile.name} avatar`} className="w-full h-full object-cover" />
      </div>

      <h2 className="font-headline-md mt-2">{profile.name}</h2>
      <p className="font-body-md text-on-surface-variant">{profile.email}</p>

      <div className="mt-6 w-full px-4">
        <button onClick={() => setOpen(true)} className="w-full py-2 bg-primary text-on-primary font-label-md rounded-lg border-2 border-border-heavy shadow-comic hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-comic-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Edit Profile
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left">
          <div className="absolute inset-0 bg-border-heavy/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" className="relative z-10 w-full max-w-md bg-surface border-2 border-border-heavy rounded-xl shadow-comic-heavy p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 id="profile-modal-title" className="font-headline-md text-ink">Edit Profile</h3>
              <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full border-2 border-border-heavy bg-surface-container-low flex items-center justify-center comic-interactive shadow-comic-sm" aria-label="Close">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form action={async (fd) => { await editProfile(fd); setOpen(false); }} className="flex flex-col gap-4">
              <div>
                <label className="block font-label-md mb-2 text-ink">Full Name</label>
                <input name="name" type="text" required defaultValue={profile.name} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block font-label-md mb-2 text-ink">Email</label>
                <input name="email" type="email" required defaultValue={profile.email} className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <ComicButton type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</ComicButton>
                <ComicButton type="submit" variant="primary" icon="save">Save Changes</ComicButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </ComicCard>
  );
}
