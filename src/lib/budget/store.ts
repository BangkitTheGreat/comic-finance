import { getDb, nextId } from "@/lib/db/client";

export type BudgetStatus = "active" | "paused";

// One row per (category, month). The limit is always positive; stopping a
// budget is the explicit `paused` status, never a zero limit. Both rules are
// also enforced by the table itself (CHECK + UNIQUE in db/client.ts), so no
// code path can double-count a category or store a nonsense limit.
export interface Budget {
  id: string;
  categoryId: string;
  /** "YYYY-MM". A budget belongs to exactly one month; other months are separate rows. */
  month: string;
  limit: number;
  status: BudgetStatus;
}

interface BudgetRow {
  id: string;
  category_id: string;
  month: string;
  limit_amount: number;
  status: BudgetStatus;
}

function toBudget(row: BudgetRow): Budget {
  return { id: row.id, categoryId: row.category_id, month: row.month, limit: row.limit_amount, status: row.status };
}

export function listBudgets(workspaceId: string, month: string): Budget[] {
  const rows = getDb()
    .prepare("SELECT * FROM budgets WHERE workspace_id = ? AND month = ? ORDER BY id")
    .all(workspaceId, month) as unknown as BudgetRow[];
  return rows.map(toBudget);
}

export function getBudget(workspaceId: string, id: string): Budget | undefined {
  const row = getDb().prepare("SELECT * FROM budgets WHERE workspace_id = ? AND id = ?").get(workspaceId, id) as BudgetRow | undefined;
  return row ? toBudget(row) : undefined;
}

export function findBudget(workspaceId: string, categoryId: string, month: string): Budget | undefined {
  const row = getDb()
    .prepare("SELECT * FROM budgets WHERE workspace_id = ? AND category_id = ? AND month = ?")
    .get(workspaceId, categoryId, month) as BudgetRow | undefined;
  return row ? toBudget(row) : undefined;
}

export function addBudget(workspaceId: string, data: Omit<Budget, "id">): Budget {
  const id = nextId(workspaceId, "budget", "b");
  getDb()
    .prepare("INSERT INTO budgets (id, workspace_id, category_id, month, limit_amount, status) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, workspaceId, data.categoryId, data.month, data.limit, data.status);
  return { id, ...data };
}

export function updateBudget(workspaceId: string, id: string, data: Partial<Omit<Budget, "id" | "month">>): Budget | undefined {
  const existing = getBudget(workspaceId, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...data };
  getDb()
    .prepare("UPDATE budgets SET category_id = ?, limit_amount = ?, status = ? WHERE workspace_id = ? AND id = ?")
    .run(updated.categoryId, updated.limit, updated.status, workspaceId, id);
  return updated;
}

/** Removes the allocation only. Transactions in that category are untouched. */
export function removeBudget(workspaceId: string, id: string): boolean {
  const { changes } = getDb().prepare("DELETE FROM budgets WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
  return Number(changes) > 0;
}
