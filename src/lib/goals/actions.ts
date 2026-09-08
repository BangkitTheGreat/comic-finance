"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addGoal, contributeToGoal, removeGoal, updateGoal } from "./store";
import { getGoalTheme } from "./types";

function revalidateGoals() {
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function createGoal(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const target = Math.abs(Number(formData.get("target") ?? 0)) || 0;
  const current = Math.abs(Number(formData.get("current") ?? 0)) || 0;
  const icon = String(formData.get("icon") ?? "flight_takeoff");
  if (!name || target <= 0) {
    throw new Error("Name and a positive target are required");
  }
  const theme = getGoalTheme(icon);
  addGoal({ name, target, current, ...theme });
  revalidateGoals();
  redirect("/goals");
}

export async function editGoal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing goal id");
  const name = String(formData.get("name") ?? "").trim();
  const target = Math.abs(Number(formData.get("target") ?? 0)) || 0;
  const icon = String(formData.get("icon") ?? "flight_takeoff");
  if (!name || target <= 0) {
    throw new Error("Name and a positive target are required");
  }
  const theme = getGoalTheme(icon);
  updateGoal(id, { name, target, ...theme });
  revalidateGoals();
  revalidatePath(`/goals/${id}`);
}

export async function contributeGoal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing goal id");
  const amount = Number(formData.get("amount") ?? 0);
  if (!amount) throw new Error("Amount required");
  contributeToGoal(id, amount);
  revalidateGoals();
  revalidatePath(`/goals/${id}`);
}

export async function deleteGoal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing goal id");
  removeGoal(id);
  revalidateGoals();
}
