"use server";

import { revalidatePath } from "next/cache";
import { resetAllData, updateProfile } from "./store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField } from "@/lib/form-validation";

export async function editProfile(form: FormData) {
  return runMutation(() => {
    const name = textField(form, "name");
    const email = textField(form, "email");
    if (name.length > 80 || /[\r\n\t]/.test(name)) throw new ValidationError("Use a name of 80 characters or fewer, on one line.", "name");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Enter a valid email address, such as penny@example.com.", "email");
    updateProfile(name, email);
    revalidatePath("/", "layout");
  });
}

// Demo-only reset. This does not delete an authenticated user account.
export async function resetDemoData(form: FormData) {
  return runMutation(() => {
    if (textField(form, "confirmation") !== "RESET") throw new ValidationError("Type RESET to confirm.", "confirmation");
    resetAllData();
    revalidatePath("/", "layout");
  });
}
