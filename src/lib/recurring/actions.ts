"use server";

import { revalidatePath } from "next/cache";
import { addRecurring, removeRecurring, updateRecurring } from "./store";
import type { Frequency } from "./types";

function revalidateRecurring() {
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");
}

function buildData(formData: FormData) {
  const type = String(formData.get("type") ?? "expense") as "income" | "expense";
  return {
    merchant: String(formData.get("merchant") ?? "").trim(),
    category: String(formData.get("category") ?? "Other"),
    account: String(formData.get("account") ?? "Checking"),
    type,
    amount: Math.abs(Number(formData.get("amount") ?? 0)) || 0,
    frequency: String(formData.get("frequency") ?? "monthly") as Frequency,
    nextDue: String(formData.get("nextDue") ?? "").trim(),
  };
}

export async function createRecurring(formData: FormData) {
  const data = buildData(formData);
  if (!data.merchant || !data.nextDue || data.amount <= 0) {
    throw new Error("Merchant, amount and next date are required");
  }
  addRecurring({ ...data, active: true });
  revalidateRecurring();
}

export async function editRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing recurring id");
  const data = buildData(formData);
  if (!data.merchant || !data.nextDue || data.amount <= 0) {
    throw new Error("Merchant, amount and next date are required");
  }
  updateRecurring(id, data);
  revalidateRecurring();
}

export async function toggleRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) throw new Error("Missing recurring id");
  updateRecurring(id, { active });
  revalidateRecurring();
}

export async function deleteRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing recurring id");
  removeRecurring(id);
  revalidateRecurring();
}
