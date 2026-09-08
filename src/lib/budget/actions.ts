"use server";

import { revalidatePath } from "next/cache";
import { updateBudgetLimit } from "./store";

export async function editBudgetLimit(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing budget category id");
  const budget = Math.abs(Number(formData.get("budget") ?? 0)) || 0;
  updateBudgetLimit(id, budget);
  revalidatePath("/budget");
  revalidatePath("/");
}
