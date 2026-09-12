"use client";

import { ActionForm } from "@/components/ui/ActionForm";
import { ComicButton } from "@/components/ui/ComicButton";
import { ComicDialog } from "@/components/ui/ComicDialog";
import { createCategory, editCategory } from "@/lib/categories/actions";
import { CATEGORY_COLORS, CATEGORY_ICONS, type Category } from "@/lib/categories/types";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
}

export function CategoryFormModal({ open, onClose, editing }: Props) {
  const isEdit = editing !== null;

  return (
    <ComicDialog open={open} onClose={onClose} title={isEdit ? `Edit ${editing.name}` : "New category"}>
      <ActionForm action={isEdit ? editCategory : createCategory} onSuccess={onClose} labels={{ name: "Category name" }} className="flex flex-col gap-5">
        {isEdit && <input type="hidden" name="id" value={editing.id} />}

        <div>
          <label htmlFor="category-name" className="mb-2 block font-label-md text-ink">Name</label>
          <input
            id="category-name" name="name" type="text" required maxLength={40} autoComplete="off"
            defaultValue={editing?.name ?? ""}
            placeholder="e.g. Coffee"
            className="w-full bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary"
          />
          {isEdit && <p className="mt-1 font-caption text-on-surface-variant">Renaming keeps every past transaction, budget and balance attached.</p>}
        </div>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-3 block font-label-md text-ink">Icon</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ICONS.map((icon, i) => (
              <label key={icon} className="cursor-pointer">
                <input type="radio" name="icon" value={icon} defaultChecked={editing ? editing.icon === icon : i === 0} className="peer sr-only" />
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-border-heavy bg-surface-container-low text-ink shadow-comic-sm transition-all peer-checked:-translate-y-0.5 peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40">
                  <span className="material-symbols-outlined">{icon}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-3 block font-label-md text-ink">Color</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((color, i) => (
              <label key={color.value} className="cursor-pointer" title={color.label}>
                <input type="radio" name="color" value={color.value} defaultChecked={editing ? editing.color === color.value : i === 0} className="peer sr-only" />
                <span className={`block h-10 w-10 rounded-full border-2 border-border-heavy ${color.value} shadow-comic-sm transition-all peer-checked:-translate-y-0.5 peer-checked:ring-4 peer-checked:ring-border-heavy peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40`} />
                <span className="sr-only">{color.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-1 flex flex-wrap justify-end gap-2">
          <ComicButton type="button" variant="outline" onClick={onClose}>Cancel</ComicButton>
          <ComicButton type="submit" variant="primary" icon={isEdit ? "save" : "add"}>{isEdit ? "Save category" : "Create category"}</ComicButton>
        </div>
      </ActionForm>
    </ComicDialog>
  );
}
