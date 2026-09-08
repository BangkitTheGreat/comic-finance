"use server";

import { revalidatePath } from "next/cache";
import { addAccount, removeAccount, updateAccount } from "./store";
import { getAccountTypeMeta, type AccountType } from "./types";

function revalidateAccounts() {
  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
}

function buildData(formData: FormData) {
  const type = String(formData.get("type") ?? "checking") as AccountType;
  const meta = getAccountTypeMeta(type);
  return {
    name: String(formData.get("name") ?? "").trim(),
    type,
    initialBalance: Number(formData.get("initialBalance") ?? 0) || 0,
    color: meta.color,
  };
}

export async function createAccount(formData: FormData) {
  const data = buildData(formData);
  if (!data.name) throw new Error("Account name is required");
  addAccount(data);
  revalidateAccounts();
}

export async function editAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing account id");
  const data = buildData(formData);
  if (!data.name) throw new Error("Account name is required");
  updateAccount(id, data);
  revalidateAccounts();
}

export async function deleteAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing account id");
  removeAccount(id);
  revalidateAccounts();
}
