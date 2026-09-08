"use server";

import { revalidatePath } from "next/cache";
import { setSetting } from "./store";
import type { SettingKey } from "./types";

export async function toggleSetting(formData: FormData) {
  const key = String(formData.get("key") ?? "") as SettingKey;
  const value = String(formData.get("value") ?? "") === "true";
  if (!key) throw new Error("Missing setting key");
  setSetting(key, value);
  revalidatePath("/", "layout");
}
