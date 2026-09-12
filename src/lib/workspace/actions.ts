"use server";

import { revalidatePath } from "next/cache";
import { getWorkspaceId } from "./context";
import { getWorkspaceStatus, setWorkspaceStatus, clearWorkspaceFinancialData } from "./store";
import { loadSampleDataInto } from "./sampleData";
import { withTransaction } from "@/lib/db/client";
import { runMutation, ValidationError } from "@/lib/action-result";
import { textField } from "@/lib/form-validation";
import { revalidateFinancialPages } from "@/lib/financial-cache";

// Goals and bills aren't in revalidateFinancialPages' path list (they were
// never touched by the old financial actions), but Clear and Load sample
// both change them too.
function revalidateEverythingFinancial() {
  revalidateFinancialPages();
  revalidatePath("/goals");
  revalidatePath("/bills");
}

/**
 * Empties every financial table for this workspace. Requires typing "CLEAR"
 * — same confirm-by-typing pattern the old demo reset used — and runs as one
 * atomic transaction (see clearWorkspaceFinancialData): every table clears
 * together, or the whole thing rolls back and nothing changes.
 */
export async function clearFinancialData(form: FormData) {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (textField(form, "confirmation") !== "CLEAR") {
      throw new ValidationError('Type CLEAR to continue.', "confirmation");
    }
    clearWorkspaceFinancialData(workspaceId);
    revalidateEverythingFinancial();
  });
}

/**
 * Fills an empty workspace with the sample dataset. Refuses on a workspace
 * that already has financial data — sample data must never silently
 * overwrite something the user actually entered; they have to Clear first
 * if they want to start over with samples.
 */
export async function loadSampleData() {
  const workspaceId = await getWorkspaceId();
  return runMutation(() => {
    if (getWorkspaceStatus(workspaceId) !== "empty") {
      throw new ValidationError("Sample data is only available for an empty workspace. Clear your data first if you want to start over with samples.");
    }
    withTransaction(() => {
      loadSampleDataInto(workspaceId);
      setWorkspaceStatus(workspaceId, "active");
    });
    revalidateEverythingFinancial();
  });
}
