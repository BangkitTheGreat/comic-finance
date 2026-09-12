import type { Transaction } from "./types";
import { getDb, nextId } from "@/lib/db/client";

interface TransactionRow {
  id: string;
  merchant: string;
  category_id: string;
  account_id: string;
  date: string;
  amount: number;
  note: string | null;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    merchant: row.merchant,
    categoryId: row.category_id,
    accountId: row.account_id,
    date: row.date,
    amount: row.amount,
    note: row.note ?? undefined,
  };
}

export function transactionTotalsByAccount(workspaceId: string): Map<string, number> {
  const totals = new Map<string, number>();
  for (const tx of listTransactions(workspaceId)) totals.set(tx.accountId, (totals.get(tx.accountId) ?? 0) + tx.amount);
  return totals;
}

export function hasTransactionsForAccount(workspaceId: string, id: string): boolean {
  const row = getDb()
    .prepare("SELECT 1 FROM transactions WHERE workspace_id = ? AND account_id = ? LIMIT 1")
    .get(workspaceId, id);
  return row !== undefined;
}

export function transactionCountsByAccount(workspaceId: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const tx of listTransactions(workspaceId)) counts.set(tx.accountId, (counts.get(tx.accountId) ?? 0) + 1);
  return counts;
}

/** Repoints every transaction on `fromId` at `toId`. Returns how many moved. */
export function reassignTransactions(workspaceId: string, fromId: string, toId: string): number {
  const { changes } = getDb()
    .prepare("UPDATE transactions SET account_id = ? WHERE workspace_id = ? AND account_id = ?")
    .run(toId, workspaceId, fromId);
  return Number(changes);
}

export function listTransactions(workspaceId: string): Transaction[] {
  const rows = getDb()
    .prepare("SELECT * FROM transactions WHERE workspace_id = ? ORDER BY date DESC, id DESC")
    .all(workspaceId) as unknown as TransactionRow[];
  return rows.map(toTransaction);
}

export function getTransaction(workspaceId: string, id: string): Transaction | undefined {
  const row = getDb().prepare("SELECT * FROM transactions WHERE workspace_id = ? AND id = ?").get(workspaceId, id) as TransactionRow | undefined;
  return row ? toTransaction(row) : undefined;
}

export function addTransaction(workspaceId: string, data: Omit<Transaction, "id">): Transaction {
  const id = nextId(workspaceId, "transaction", "t");
  getDb()
    .prepare("INSERT INTO transactions (id, workspace_id, merchant, category_id, account_id, date, amount, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, workspaceId, data.merchant, data.categoryId, data.accountId, data.date, data.amount, data.note ?? null);
  return { id, ...data };
}

export function updateTransaction(
  workspaceId: string,
  id: string,
  data: Partial<Omit<Transaction, "id">>
): Transaction | undefined {
  const existing = getTransaction(workspaceId, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...data };
  getDb()
    .prepare("UPDATE transactions SET merchant = ?, category_id = ?, account_id = ?, date = ?, amount = ?, note = ? WHERE workspace_id = ? AND id = ?")
    .run(updated.merchant, updated.categoryId, updated.accountId, updated.date, updated.amount, updated.note ?? null, workspaceId, id);
  return updated;
}

export function removeTransaction(workspaceId: string, id: string): boolean {
  const { changes } = getDb().prepare("DELETE FROM transactions WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
  return Number(changes) > 0;
}
