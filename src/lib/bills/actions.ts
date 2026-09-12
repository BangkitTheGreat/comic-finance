"use server";

import { revalidatePath } from "next/cache";
import { addBill, getBill, removeBill, setBillPaid, updateBill } from "./store";
import { BILL_ICONS } from "./types";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField, enumField, dateField } from "@/lib/form-validation";
import { currencyAmountField } from "@/lib/currency/amount";
import { getWorkspaceId } from "@/lib/workspace/context";

function revalidateBills() {
  revalidatePath("/bills");
  revalidatePath("/");
}

function buildData(form: FormData, existingBase?: number) {
  return {
    name: textField(form, "name"),
    // Currency-aware like every other amount in the app: the form says which
    // denomination it was typed in, and the server converts once. Before this
    // a bill entered while viewing IDR was stored as if it were USD.
    amount: currencyAmountField(form, { existingBase }),
    dueDate: dateField(form, "dueDate"),
    icon: enumField(form, "icon", BILL_ICONS),
  };
}

export async function createBill(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    addBill(workspaceId, { ...buildData(form), paid: false });
    revalidateBills();
  });
}

export async function editBill(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    const id = textField(form, "id");
    const existing = getBill(workspaceId, id);
    if (!existing) throw new ValidationError("Bill no longer exists.");
    updateBill(workspaceId, id, buildData(form, existing.amount));
    revalidateBills();
  });
}

async function setPaid(form: FormData, paid: boolean) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (!setBillPaid(workspaceId, textField(form, "id"), paid)) throw new ValidationError("Bill no longer exists.");
    revalidateBills();
  });
}

export async function payBill(form: FormData) {
  return setPaid(form, true);
}

export async function unpayBill(form: FormData) {
  return setPaid(form, false);
}

export async function deleteBill(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (!removeBill(workspaceId, textField(form, "id"))) throw new ValidationError("Bill no longer exists.");
    revalidateBills();
  });
}
