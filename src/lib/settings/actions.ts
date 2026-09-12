"use server";

import { revalidatePath } from "next/cache";
import { setSetting } from "./store";
import { SETTING_GROUPS } from "./types";
import { enumField } from "@/lib/form-validation";
import { runMutation } from "@/lib/action-result";
import { getWorkspaceId } from "@/lib/workspace/context";

export async function toggleSetting(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const key = enumField(form, "key", SETTING_GROUPS.flatMap(group => group.items.map(item => item.key)));
    const value = enumField(form, "value", ["true", "false"]) === "true";
    setSetting(workspaceId, key, value);
    revalidatePath("/", "layout");
  });
}
