import type { Account, AccountType, AccountWithBalance } from "./types";
import { getDb, nextId } from "@/lib/db/client";
import { transactionTotalsByAccount, transactionCountsByAccount, hasTransactionsForAccount } from "@/lib/transactions/store";
import { listRecurring, recurringCountsByAccount } from "@/lib/recurring/store";
import { ValidationError } from "@/lib/action-result";

interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  color: string;
}

function toAccount(row: AccountRow): Account {
  return { id: row.id, name: row.name, type: row.type, initialBalance: row.initial_balance, color: row.color };
}

export function listAccounts(workspaceId: string): Account[] {
  const rows = getDb().prepare("SELECT * FROM accounts WHERE workspace_id = ? ORDER BY id").all(workspaceId) as unknown as AccountRow[];
  return rows.map(toAccount);
}

export function getAccount(workspaceId: string, id: string): Account | undefined {
  const row = getDb().prepare("SELECT * FROM accounts WHERE workspace_id = ? AND id = ?").get(workspaceId, id) as AccountRow | undefined;
  return row ? toAccount(row) : undefined;
}

export function addAccount(workspaceId: string, data: Omit<Account, "id">): Account {
  const id = nextId(workspaceId, "account", "a");
  getDb()
    .prepare("INSERT INTO accounts (id, workspace_id, name, type, initial_balance, color) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, workspaceId, data.name, data.type, data.initialBalance, data.color);
  return { id, ...data };
}

export function updateAccount(workspaceId: string, id: string, data: Partial<Omit<Account, "id">>): Account | undefined {
  const existing = getAccount(workspaceId, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...data };
  getDb()
    .prepare("UPDATE accounts SET name = ?, type = ?, initial_balance = ?, color = ? WHERE workspace_id = ? AND id = ?")
    .run(updated.name, updated.type, updated.initialBalance, updated.color, workspaceId, id);
  return updated;
}

export function removeAccount(workspaceId: string, id: string): boolean {
  if (!getAccount(workspaceId, id)) return false;
  if (hasTransactionsForAccount(workspaceId, id) || listRecurring(workspaceId).some((r) => r.accountId === id)) {
    throw new ValidationError("This account is used by transactions or recurring rules. Move those records to another account before deleting it.");
  }
  const { changes } = getDb().prepare("DELETE FROM accounts WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
  return Number(changes) > 0;
}

export function getAccountsWithBalances(workspaceId: string): AccountWithBalance[] {
  const txByAccount = transactionTotalsByAccount(workspaceId);
  const txCounts = transactionCountsByAccount(workspaceId);
  const recCounts = recurringCountsByAccount(workspaceId);
  return listAccounts(workspaceId).map((a) => ({
    ...a,
    balance: a.initialBalance + (txByAccount.get(a.id) ?? 0),
    transactionCount: txCounts.get(a.id) ?? 0,
    recurringCount: recCounts.get(a.id) ?? 0,
  }));
}
