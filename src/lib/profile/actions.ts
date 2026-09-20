"use server";

import { revalidatePath } from "next/cache";
import { updateProfile } from "./store";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField } from "@/lib/form-validation";
import { getWorkspaceId } from "@/lib/workspace/context";

export async function editProfile(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const name = textField(form, "name");
    const email = textField(form, "email");
    if (name.length > 80 || /[\r\n\t]/.test(name)) throw new ValidationError("Use a name of 80 characters or fewer, on one line.", "name");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Enter a valid email address, such as user@comicfinance.example.", "email");
    updateProfile(workspaceId, name, email);
    revalidatePath("/", "layout");
  });
}
