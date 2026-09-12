import { getDb } from "@/lib/db/client";
import { ensureWorkspace, FINANCIAL_TABLES } from "./store";

// Two fixed ids for tests: one is "the workspace under test", the other lets
// a test prove an operation on one workspace never touches the other
// (Bagian 6, risk #3 — cross-workspace access).
export const TEST_WORKSPACE_ID = "test-workspace";
export const OTHER_TEST_WORKSPACE_ID = "test-workspace-other";

/**
 * Wipes every row for a workspace id, across financial tables and the
 * profile/settings/currency/workspace rows themselves, then recreates a
 * fresh default workspace row. Call this in `beforeEach` in place of the old
 * `Reflect.deleteProperty(globalThis, "__xStore")` pattern — the store is
 * now a shared SQLite connection (real, or vitest's per-file ":memory:", see
 * vitest.config.ts), not a per-test-file global object, so it needs an
 * explicit reset instead of just disappearing between test files.
 */
export function resetWorkspaceForTest(workspaceId: string = TEST_WORKSPACE_ID): void {
  const db = getDb();
  for (const table of FINANCIAL_TABLES) {
    db.prepare(`DELETE FROM ${table} WHERE workspace_id = ?`).run(workspaceId);
  }
  for (const table of ["profiles", "settings", "currency", "counters", "categories"]) {
    db.prepare(`DELETE FROM ${table} WHERE workspace_id = ?`).run(workspaceId);
  }
  db.prepare("DELETE FROM workspaces WHERE id = ?").run(workspaceId);
  ensureWorkspace(workspaceId);
}
