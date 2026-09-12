"use server";

import { revalidatePath } from "next/cache";
import { addGoal, contributeToGoal, getGoal, removeGoal, updateGoal } from "./store";
import { getGoalTheme, GOAL_THEMES } from "./types";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { getWorkspaceId } from "@/lib/workspace/context";

function revalidateGoals(id?: string) {
  revalidatePath("/goals");
  revalidatePath("/");
  if (id) revalidatePath(`/goals/${id}`);
}

function themeField(form: FormData) {
  return getGoalTheme(enumField(form, "icon", GOAL_THEMES.map((t) => t.icon)));
}

export async function createGoal(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const name = textField(form, "name");
    const target = currencyAmountField(form, { field: "target" });
    // A starting amount is optional and may be zero, unlike the target.
    const current = form.get("current") ? currencyAmountField(form, { field: "current", positive: false }) : 0;
    if (current < 0) throw new ValidationError("A starting amount cannot be negative.", "current");
    addGoal(workspaceId, { name, target, current, ...themeField(form) });
    revalidateGoals();
  });
}

export async function editGoal(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getGoal(workspaceId, id);
    if (!existing) throw new ValidationError("Goal no longer exists.");
    updateGoal(workspaceId, id, {
      name: textField(form, "name"),
      target: currencyAmountField(form, { field: "target", existingBase: existing.target }),
      ...themeField(form),
    });
    revalidateGoals(id);
  });
}

export async function contributeGoal(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    if (!getGoal(workspaceId, id)) throw new ValidationError("Goal no longer exists.");
    const direction = enumField(form, "direction", ["add", "withdraw"]);
    const amount = currencyAmountField(form, { field: "amount" });
    contributeToGoal(workspaceId, id, direction === "add" ? amount : -amount);
    revalidateGoals(id);
  });
}

export async function deleteGoal(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (!removeGoal(workspaceId, textField(form, "id"))) throw new ValidationError("Goal no longer exists.");
    revalidateGoals();
  });
}
