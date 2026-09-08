"use server";

import { revalidatePath } from "next/cache";
import { addBill, removeBill, setBillPaid, updateBill } from "./store";

function revalidateBills() {
  revalidatePath("/bills");
  revalidatePath("/");
}

function buildData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    amount: Math.abs(Number(formData.get("amount") ?? 0)) || 0,
    dueDate: String(formData.get("dueDate") ?? "").trim(),
    icon: String(formData.get("icon") ?? "credit_card"),
  };
}

export async function createBill(formData: FormData) {
  const data = buildData(formData);
  if (!data.name || !data.dueDate || data.amount <= 0) {
    throw new Error("Name, amount and due date are required");
  }
  addBill({ ...data, paid: false });
  revalidateBills();
}

export async function editBill(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing bill id");
  const data = buildData(formData);
  if (!data.name || !data.dueDate || data.amount <= 0) {
    throw new Error("Name, amount and due date are required");
  }
  updateBill(id, data);
  revalidateBills();
}

export async function payBill(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing bill id");
  setBillPaid(id, true);
  revalidateBills();
}

export async function unpayBill(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing bill id");
  setBillPaid(id, false);
  revalidateBills();
}

export async function deleteBill(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing bill id");
  removeBill(id);
  revalidateBills();
}
