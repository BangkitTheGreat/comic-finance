"use server";

import {
  addCategory, getCategory, getCategoryByName, getCategoryUsage, isCategoryInUse,
  reassignCategory, removeCategory, setCategoryArchived, updateCategory,
} from "./store";
import { CATEGORY_COLOR_VALUES, CATEGORY_ICONS } from "./types";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField } from "@/lib/form-validation";
import { revalidateFinancialPages } from "@/lib/financial-cache";
import { getWorkspaceId } from "@/lib/workspace/context";
import { withTransaction } from "@/lib/db/client";

function nameField(workspaceId: string, form: FormData, exceptId?: string): string {
  const name = textField(form, "name");
  if (name.length > 40 || /[\r\n\t]/.test(name)) throw new ValidationError("Use a name of 40 characters or fewer, on one line.", "name");
  const clash = getCategoryByName(workspaceId, name);
  if (clash && clash.id !== exceptId) throw new ValidationError("A category with this name already exists.", "name");
  return name;
}

function styleFields(form: FormData) {
  return {
    icon: enumField(form, "icon", CATEGORY_ICONS),
    color: enumField(form, "color", CATEGORY_COLOR_VALUES),
  };
}

export async function createCategory(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    addCategory(workspaceId, { name: nameField(workspaceId, form), ...styleFields(form) });
    revalidateFinancialPages();
  });
}

/**
 * Renames or restyles a category. Every reference is by id, so history is
 * untouched: past transactions keep their amounts and stay attached.
 */
export async function editCategory(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    if (!getCategory(workspaceId, id)) throw new ValidationError("Category no longer exists.");
    updateCategory(workspaceId, id, { name: nameField(workspaceId, form, id), ...styleFields(form) });
    revalidateFinancialPages();
  });
}

/** Archiving hides a category from pickers while keeping its history readable. */
export async function archiveCategory(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const archived = enumField(form, "archived", ["true", "false"]) === "true";
    if (!setCategoryArchived(workspaceId, id, archived)) throw new ValidationError("Category no longer exists.");
    revalidateFinancialPages();
  });
}

/**
 * Permanent delete. A category still in use must have its records moved to
 * another category in the same operation — the same escape hatch account
 * deletion offers — so nothing is ever left without a category.
 */
export async function deleteCategory(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const category = getCategory(workspaceId, id);
    if (!category) throw new ValidationError("Category no longer exists.");

    const moveToCategoryId = textField(form, "moveToCategoryId", false);
    if (moveToCategoryId) {
      if (moveToCategoryId === id) throw new ValidationError("Choose a different category to move records to.", "moveToCategoryId");
      if (!getCategory(workspaceId, moveToCategoryId)) throw new ValidationError("The category to move records to does not exist.", "moveToCategoryId");
    } else if (isCategoryInUse(getCategoryUsage(workspaceId, id))) {
      throw new ValidationError(
        "This category is still used by transactions, recurring rules or budgets. Choose a category to move them to, or archive it instead.",
        "moveToCategoryId"
      );
    }

    withTransaction(() => {
      if (moveToCategoryId) reassignCategory(workspaceId, id, moveToCategoryId);
      removeCategory(workspaceId, id);
    });
    revalidateFinancialPages();
  });
}
