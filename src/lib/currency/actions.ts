"use server";

import { revalidatePath } from "next/cache";
import { setCurrencyCode } from "./store";
import type { CurrencyCode } from "./types";

export async function changeCurrency(formData: FormData) {
  const code = String(formData.get("code") ?? "USD") as CurrencyCode;
  setCurrencyCode(code);
  revalidatePath("/", "layout");
}
