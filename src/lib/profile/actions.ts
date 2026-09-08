"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resetAllData, updateProfile } from "./store";

export async function editProfile(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !email) throw new Error("Name and email are required");
  updateProfile(name, email);
  revalidatePath("/profile");
  revalidatePath("/", "layout");
}

export async function deleteAccountData() {
  resetAllData();
  revalidatePath("/", "layout");
  redirect("/login");
}
