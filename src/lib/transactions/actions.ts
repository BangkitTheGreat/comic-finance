"use server";

import { revalidatePath } from "next/cache";
import { addTransaction, removeTransaction, updateTransaction } from "./store";

function parseAmount(raw: FormDataEntryValue | null, type: string): number {
  const value = Math.abs(Number(raw ?? 0)) || 0;
  return type === "income" ? value : -value;
}

function buildData(formData: FormData) {
  const type = String(formData.get("type") ?? "expense");
  return {
    merchant: String(formData.get("merchant") ?? "").trim(),
    category: String(formData.get("category") ?? "Other"),
    account: String(formData.get("account") ?? "Checking"),
    date: String(formData.get("date") ?? "").trim(),
    amount: parseAmount(formData.get("amount"), type),
    note: String(formData.get("note") ?? "").trim() || undefined,
  };
}

export async function createTransaction(formData: FormData) {
  const data = buildData(formData);
  if (!data.merchant || !data.date) {
    throw new Error("Merchant and date are required");
  }
  addTransaction(data);
  revalidatePath("/transactions");
}

export async function editTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing transaction id");
  const data = buildData(formData);
  if (!data.merchant || !data.date) {
    throw new Error("Merchant and date are required");
  }
  updateTransaction(id, data);
  revalidatePath("/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing transaction id");
  removeTransaction(id);
  revalidatePath("/transactions");
}
