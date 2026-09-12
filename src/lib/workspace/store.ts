import { getDb, withTransaction } from "@/lib/db/client";
import type { WorkspaceCounts, WorkspaceStatus } from "./types";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";
import { ensureBuiltinCategories } from "@/lib/categories/store";

const DEFAULT_PROFILE = { name: "Penny User", email: "penny@example.com" };
const DEFAULT_CURRENCY_CODE = "USD";

/**
 * Creates the workspace row (status "empty") and its default profile,
 * settings and currency rows if they don't exist yet. Every store function
 * calls this before it reads or writes, so a brand-new workspace id always
 * has a consistent row to act on instead of every table needing its own
 * "or insert a default" fallback.
 */
export function ensureWorkspace(workspaceId: string): void {
  const db = getDb();
  db.prepare("INSERT INTO workspaces (id, status, created_at) VALUES (?, 'empty', ?) ON CONFLICT(id) DO NOTHING")
    .run(workspaceId, new Date().toISOString());
  db.prepare("INSERT INTO profiles (workspace_id, name, email) VALUES (?, ?, ?) ON CONFLICT(workspace_id) DO NOTHING")
    .run(workspaceId, DEFAULT_PROFILE.name, DEFAULT_PROFILE.email);
  db.prepare(
    "INSERT INTO settings (workspace_id, notify_bills, notify_budget, reduce_motion) VALUES (?, ?, ?, ?) ON CONFLICT(workspace_id) DO NOTHING"
  ).run(workspaceId, Number(DEFAULT_SETTINGS.notifyBills), Number(DEFAULT_SETTINGS.notifyBudget), Number(DEFAULT_SETTINGS.reduceMotion));
  db.prepare("INSERT INTO currency (workspace_id, code) VALUES (?, ?) ON CONFLICT(workspace_id) DO NOTHING")
    .run(workspaceId, DEFAULT_CURRENCY_CODE);
  // Categories are configuration, not financial data: seeded once here,
  // never touched by clearWorkspaceFinancialData, so an emptied workspace
  // keeps the default categories as choices with no amounts attached.
  ensureBuiltinCategories(workspaceId);
}

export function getWorkspaceStatus(workspaceId: string): WorkspaceStatus {
  ensureWorkspace(workspaceId);
  const row = getDb().prepare("SELECT status FROM workspaces WHERE id = ?").get(workspaceId) as { status: WorkspaceStatus } | undefined;
  return row?.status ?? "empty";
}

export function setWorkspaceStatus(workspaceId: string, status: WorkspaceStatus): void {
  ensureWorkspace(workspaceId);
  getDb().prepare("UPDATE workspaces SET status = ? WHERE id = ?").run(status, workspaceId);
}

export const FINANCIAL_TABLES = ["accounts", "transactions", "recurring", "budgets", "goals", "bills"] as const;

export function getWorkspaceCounts(workspaceId: string): WorkspaceCounts {
  ensureWorkspace(workspaceId);
  const db = getDb();
  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) as n FROM ${table} WHERE workspace_id = ?`).get(workspaceId) as { n: number }).n;
  return {
    accounts: count("accounts"),
    transactions: count("transactions"),
    budgets: count("budgets"),
    goals: count("goals"),
    bills: count("bills"),
    recurring: count("recurring"),
  };
}

/**
 * Empties every financial table for this workspace and marks it "empty",
 * in one SQLite transaction — all six tables clear together or none do.
 * Deliberately does not touch profiles/settings/currency: those are
 * preferences, not financial data, and survive a clear.
 */
export function clearWorkspaceFinancialData(workspaceId: string): void {
  ensureWorkspace(workspaceId);
  withTransaction((db) => {
    for (const table of FINANCIAL_TABLES) {
      db.prepare(`DELETE FROM ${table} WHERE workspace_id = ?`).run(workspaceId);
    }
    db.prepare("UPDATE workspaces SET status = 'empty' WHERE id = ?").run(workspaceId);
  });
}
