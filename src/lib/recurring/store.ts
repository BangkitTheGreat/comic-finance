import type { Recurring } from "./types";
import { advanceDate, isDue } from "./types";
import { addTransaction } from "@/lib/transactions/store";
import { getAccount } from "@/lib/accounts/store";
import { isPositiveAmount, isValidIsoDate } from "@/lib/validation";
import { getCategory } from "@/lib/categories/store";
import { FREQUENCIES } from "./types";
import { getDb, nextId } from "@/lib/db/client";

interface RecurringRow {
  id: string;
  merchant: string;
  category_id: string;
  account_id: string;
  type: "income" | "expense";
  amount: number;
  frequency: Recurring["frequency"];
  next_due: string;
  active: number;
}

function toRecurring(row: RecurringRow): Recurring {
  return {
    id: row.id,
    merchant: row.merchant,
    categoryId: row.category_id,
    accountId: row.account_id,
    type: row.type,
    amount: row.amount,
    frequency: row.frequency,
    nextDue: row.next_due,
    active: Boolean(row.active),
  };
}

export function listRecurring(workspaceId: string): Recurring[] {
  const rows = getDb()
    .prepare("SELECT * FROM recurring WHERE workspace_id = ? ORDER BY next_due")
    .all(workspaceId) as unknown as RecurringRow[];
  return rows.map(toRecurring);
}

export function recurringCountsByAccount(workspaceId: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const rec of listRecurring(workspaceId)) counts.set(rec.accountId, (counts.get(rec.accountId) ?? 0) + 1);
  return counts;
}

/** Repoints every recurring rule on `fromId` at `toId`. Returns how many moved. */
export function reassignRecurring(workspaceId: string, fromId: string, toId: string): number {
  const { changes } = getDb()
    .prepare("UPDATE recurring SET account_id = ? WHERE workspace_id = ? AND account_id = ?")
    .run(toId, workspaceId, fromId);
  return Number(changes);
}

export function getRecurring(workspaceId: string, id: string): Recurring | undefined {
  const row = getDb().prepare("SELECT * FROM recurring WHERE workspace_id = ? AND id = ?").get(workspaceId, id) as RecurringRow | undefined;
  return row ? toRecurring(row) : undefined;
}

export function addRecurring(workspaceId: string, data: Omit<Recurring, "id">): Recurring {
  const id = nextId(workspaceId, "recurring", "r");
  getDb()
    .prepare(
      "INSERT INTO recurring (id, workspace_id, merchant, category_id, account_id, type, amount, frequency, next_due, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(id, workspaceId, data.merchant, data.categoryId, data.accountId, data.type, data.amount, data.frequency, data.nextDue, Number(data.active));
  return { id, ...data };
}

export function updateRecurring(workspaceId: string, id: string, data: Partial<Omit<Recurring, "id">>): Recurring | undefined {
  const existing = getRecurring(workspaceId, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...data };
  getDb()
    .prepare(
      "UPDATE recurring SET merchant = ?, category_id = ?, account_id = ?, type = ?, amount = ?, frequency = ?, next_due = ?, active = ? WHERE workspace_id = ? AND id = ?"
    )
    .run(updated.merchant, updated.categoryId, updated.accountId, updated.type, updated.amount, updated.frequency, updated.nextDue, Number(updated.active), workspaceId, id);
  return updated;
}

export function removeRecurring(workspaceId: string, id: string): boolean {
  const { changes } = getDb().prepare("DELETE FROM recurring WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
  return Number(changes) > 0;
}

export function processDueRecurring(workspaceId: string): number {
  let posted = 0;
  for (const rec of listRecurring(workspaceId)) {
    if (!rec.active || !getAccount(workspaceId, rec.accountId) || !isPositiveAmount(rec.amount) ||
      !isValidIsoDate(rec.nextDue) || !["income", "expense"].includes(rec.type) ||
      !FREQUENCIES.some(f => f.value === rec.frequency) || !getCategory(workspaceId, rec.categoryId)) continue;
    let nextDue = rec.nextDue;
    let guard = 0;
    while (isDue(nextDue) && guard < 60) {
      addTransaction(workspaceId, {
        merchant: rec.merchant,
        categoryId: rec.categoryId,
        accountId: rec.accountId,
        date: nextDue,
        amount: rec.type === "income" ? Math.abs(rec.amount) : -Math.abs(rec.amount),
        note: "Recurring",
      });
      nextDue = advanceDate(nextDue, rec.frequency);
      posted += 1;
      guard += 1;
    }
    if (nextDue !== rec.nextDue) updateRecurring(workspaceId, rec.id, { nextDue });
  }
  return posted;
}
