"use client";

import { useState } from "react";
import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicDialog } from "@/components/ui/ComicDialog";
import { CategoryFormModal } from "./CategoryFormModal";
import { archiveCategory, deleteCategory } from "@/lib/categories/actions";
import type { Category, CategoryWithUsage } from "@/lib/categories/types";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithUsage[];
}

function usageLabel(usage: CategoryWithUsage["usage"]): string {
  const parts = [
    usage.transactions && `${usage.transactions} transaction${usage.transactions === 1 ? "" : "s"}`,
    usage.recurring && `${usage.recurring} recurring rule${usage.recurring === 1 ? "" : "s"}`,
    usage.budgets && `${usage.budgets} budget${usage.budgets === 1 ? "" : "s"}`,
  ].filter(Boolean);
  return parts.length ? `Used by ${parts.join(", ")}` : "Not used yet";
}

/** Delete needs a destination while anything still points at the category. */
function DeleteRow({ category, others, onDone }: { category: CategoryWithUsage; others: Category[]; onDone: () => void }) {
  const inUse = category.usage.transactions + category.usage.recurring + category.usage.budgets > 0;
  return (
    <ActionForm
      action={deleteCategory}
      onSuccess={onDone}
      labels={{ moveToCategoryId: "Move records to" }}
      confirmation={inUse
        ? `Delete ${category.name} and move its records to the category you picked?`
        : `Delete ${category.name}? It has no records attached.`}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="id" value={category.id} />
      {inUse && (
        <div className="min-w-0 flex-1">
          <label htmlFor={`move-${category.id}`} className="mb-1 block font-caption text-on-surface-variant">Move records to</label>
          <select
            id={`move-${category.id}`} name="moveToCategoryId" required
            className="w-full cursor-pointer rounded-lg border-2 border-border-heavy bg-surface-container-low p-2 font-caption focus:border-primary focus:outline-none"
          >
            {others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <ComicButton type="submit" variant="danger" icon="delete" className="!px-3 !py-2">Delete</ComicButton>
    </ActionForm>
  );
}

export function CategoryManagerModal({ open, onClose, categories }: Props) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <ComicDialog open={open && editing === null} onClose={onClose} title="Manage categories">
        <p className="mb-4 font-body-md text-on-surface-variant">
          Renaming keeps history intact. A category in use can be archived, or deleted once its records are moved somewhere else.
        </p>
        <ul className="flex flex-col divide-y-2 divide-border-heavy/20">
          {categories.map((category) => (
            <li key={category.id} className="py-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border-heavy ${category.color}`}>
                  <span className="material-symbols-outlined text-[18px] text-ink">{category.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-label-md text-ink">
                    {category.name}
                    {category.archived && <span className="rounded border border-border-heavy bg-surface-container-high px-1.5 py-0.5 font-caption text-on-surface-variant">Archived</span>}
                  </p>
                  <p className="font-caption text-on-surface-variant">{usageLabel(category.usage)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button" onClick={() => setEditing(category)} aria-label={`Edit ${category.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border-heavy bg-surface shadow-comic-sm comic-interactive"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <ActionForm action={archiveCategory} className="inline-block">
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="archived" value={String(!category.archived)} />
                    <button
                      type="submit" aria-label={`${category.archived ? "Restore" : "Archive"} ${category.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border-heavy bg-surface shadow-comic-sm comic-interactive"
                    >
                      <span className="material-symbols-outlined text-[18px]">{category.archived ? "unarchive" : "archive"}</span>
                    </button>
                  </ActionForm>
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === category.id ? null : category.id)}
                    aria-expanded={expanded === category.id}
                    aria-label={`Delete ${category.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border-heavy bg-error-container text-on-error-container shadow-comic-sm comic-interactive"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
              {expanded === category.id && (
                <div className="mt-3 rounded-lg border-2 border-border-heavy bg-surface-container-low p-3">
                  <DeleteRow
                    category={category}
                    others={categories.filter((c) => c.id !== category.id && !c.archived)}
                    onDone={() => setExpanded(null)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end">
          <ComicButton type="button" variant="outline" onClick={onClose}>Done</ComicButton>
        </div>
      </ComicDialog>

      <CategoryFormModal open={editing !== null} onClose={() => setEditing(null)} editing={editing} />
    </>
  );
}
