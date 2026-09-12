"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Comic-styled wrapper around the native <dialog>. showModal() gives focus
 * trapping, Escape-to-close, inert background and a ::backdrop for free —
 * no hand-rolled overlay or keydown listener. Children only mount while
 * open, so a form inside starts fresh every time.
 */
export function ComicDialog({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    else if (!open && node.open) node.close();
    return () => { if (node.open) node.close(); };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      className="m-auto w-[calc(100vw-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border-2 border-border-heavy bg-surface p-0 text-ink shadow-comic-heavy backdrop:bg-border-heavy/50 backdrop:backdrop-blur-sm"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 id={`${id}-title`} className="font-headline-md text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border-heavy bg-surface-container-low shadow-comic-sm comic-interactive"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
