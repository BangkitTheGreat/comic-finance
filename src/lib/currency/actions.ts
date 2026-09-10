"use server";

import { revalidatePath } from "next/cache";
import { setCurrencyCode } from "./store";
import { CURRENCY_LIST } from "./types";
import { enumField } from "@/lib/form-validation";
import { runMutation } from "@/lib/action-result";

export async function changeCurrency(formData: FormData) {
  return runMutation(() => {
    const code = enumField(formData, "code", CURRENCY_LIST.map(c => c.code));
    setCurrencyCode(code);
    revalidatePath("/", "layout");
  });
}
