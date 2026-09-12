import type { Category, CategoryUsage, CategoryWithUsage } from "./types";
import { CATEGORIES } from "@/lib/transactions/types";
import { getDb, nextId } from "@/lib/db/client";
import { ValidationError } from "@/lib/action-result";

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  archived: number;
  builtin: number;
}

function toCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, icon: row.icon, color: row.color, archived: Boolean(row.archived), builtin: Boolean(row.builtin) };
}

/**
 * Gives a workspace the default category set (the old static CATEGORIES
 * list) as real rows it can extend. Idempotent: skips any name already
 * present, so it's safe to call on every request and on workspaces created
 * before categories were data. Ids come out c1..c9 on a fresh workspace.
 */
export function ensureBuiltinCategories(workspaceId: string): void {
  const db = getDb();
  const any = db.prepare("SELECT 1 FROM categories WHERE workspace_id = ? LIMIT 1").get(workspaceId);
  if (any) return;
  const insert = db.prepare(
    "INSERT INTO categories (id, workspace_id, name, icon, color, archived, builtin) VALUES (?, ?, ?, ?, ?, 0, 1) ON CONFLICT(workspace_id, name) DO NOTHING"
  );
  for (const c of CATEGORIES) insert.run(nextId(workspaceId, "category", "c"), workspaceId, c.name, c.icon, c.color);
}

export function listCategories(workspaceId: string, options: { includeArchived?: boolean } = {}): Category[] {
  const sql = options.includeArchived
    ? "SELECT * FROM categories WHERE workspace_id = ? ORDER BY builtin DESC, name"
    : "SELECT * FROM categories WHERE workspace_id = ? AND archived = 0 ORDER BY builtin DESC, name";
  return (getDb().prepare(sql).all(workspaceId) as unknown as CategoryRow[]).map(toCategory);
}

export function getCategory(workspaceId: string, id: string): Category | undefined {
  const row = getDb().prepare("SELECT * FROM categories WHERE workspace_id = ? AND id = ?").get(workspaceId, id) as CategoryRow | undefined;
  return row ? toCategory(row) : undefined;
}

/** Case-insensitive name lookup, used by the migration and duplicate checks. */
export function getCategoryByName(workspaceId: string, name: string): Category | undefined {
  const row = getDb()
    .prepare("SELECT * FROM categories WHERE workspace_id = ? AND lower(name) = lower(?)")
    .get(workspaceId, name) as CategoryRow | undefined;
  return row ? toCategory(row) : undefined;
}

export function addCategory(workspaceId: string, data: Pick<Category, "name" | "icon" | "color">): Category {
  const id = nextId(workspaceId, "category", "c");
  getDb()
    .prepare("INSERT INTO categories (id, workspace_id, name, icon, color, archived, builtin) VALUES (?, ?, ?, ?, ?, 0, 0)")
    .run(id, workspaceId, data.name, data.icon, data.color);
  return { id, ...data, archived: false, builtin: false };
}

/**
 * Renames or restyles a category. Nothing else moves: transactions,
 * recurring rules and budgets point at the id, so "Transport" becoming
 * "Transportasi" keeps every past expense attached to it.
 */
export function updateCategory(workspaceId: string, id: string, data: Pick<Category, "name" | "icon" | "color">): Category | undefined {
  const existing = getCategory(workspaceId, id);
  if (!existing) return undefined;
  getDb()
    .prepare("UPDATE categories SET name = ?, icon = ?, color = ? WHERE workspace_id = ? AND id = ?")
    .run(data.name, data.icon, data.color, workspaceId, id);
  return { ...existing, ...data };
}

export function setCategoryArchived(workspaceId: string, id: string, archived: boolean): Category | undefined {
  const existing = getCategory(workspaceId, id);
  if (!existing) return undefined;
  getDb().prepare("UPDATE categories SET archived = ? WHERE workspace_id = ? AND id = ?").run(Number(archived), workspaceId, id);
  return { ...existing, archived };
}

/** How many records still point at a category — what blocks a hard delete. */
export function getCategoryUsage(workspaceId: string, id: string): CategoryUsage {
  const db = getDb();
  const count = (table: string, column: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE workspace_id = ? AND ${column} = ?`).get(workspaceId, id) as { n: number }).n;
  return {
    transactions: count("transactions", "category_id"),
    recurring: count("recurring", "category_id"),
    budgets: count("budgets", "category_id"),
  };
}

export function isCategoryInUse(usage: CategoryUsage): boolean {
  return usage.transactions > 0 || usage.recurring > 0 || usage.budgets > 0;
}

/** Every category with its reference counts, for the management screen. */
export function listCategoriesWithUsage(workspaceId: string): CategoryWithUsage[] {
  return listCategories(workspaceId, { includeArchived: true }).map((c) => ({ ...c, usage: getCategoryUsage(workspaceId, c.id) }));
}

/** Repoints every record on `fromId` at `toId`. Returns how many moved. */
export function reassignCategory(workspaceId: string, fromId: string, toId: string): number {
  const db = getDb();
  let moved = 0;
  for (const table of ["transactions", "recurring"]) {
    const { changes } = db
      .prepare(`UPDATE ${table} SET category_id = ? WHERE workspace_id = ? AND category_id = ?`)
      .run(toId, workspaceId, fromId);
    moved += Number(changes);
  }
  // A budget is one row per category per month, so moving them could collide
  // with a budget the destination already has that month. Those are dropped
  // rather than merged: two limits cannot be added into one meaningfully.
  db.prepare(
    `DELETE FROM budgets WHERE workspace_id = ? AND category_id = ?
       AND month IN (SELECT month FROM budgets WHERE workspace_id = ? AND category_id = ?)`
  ).run(workspaceId, fromId, workspaceId, toId);
  const { changes } = db
    .prepare("UPDATE budgets SET category_id = ? WHERE workspace_id = ? AND category_id = ?")
    .run(toId, workspaceId, fromId);
  return moved + Number(changes);
}

/**
 * Permanently removes a category. Refuses while anything still references
 * it — the caller must archive it, or move its records first, exactly like
 * deleting an account in use.
 */
export function removeCategory(workspaceId: string, id: string): boolean {
  const existing = getCategory(workspaceId, id);
  if (!existing) return false;
  if (isCategoryInUse(getCategoryUsage(workspaceId, id))) {
    throw new ValidationError(
      "This category is still used by transactions, recurring rules or budgets. Move those records to another category first, or archive it instead."
    );
  }
  const { changes } = getDb().prepare("DELETE FROM categories WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
  return Number(changes) > 0;
}
