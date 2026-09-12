import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { DatabaseSync } from "node:sqlite";
import { findOrphanedCategoryReferences, migrateCategoryReferences } from "./migrate";
import { getCategoryByName, listCategories, updateCategory } from "./store";
import { addTransaction, listTransactions } from "@/lib/transactions/store";
import { addBudget } from "@/lib/budget/store";
import { getBudgetUsage } from "@/lib/budget/usage";
import { addAccount, getAccountsWithBalances } from "@/lib/accounts/store";
import { getMonthlyExpenses } from "@/lib/transactions/analytics";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const cat = (name: string) => getCategoryByName(WS, name)!.id;

/**
 * Builds the pre-Part-4 shape by hand: transactions and recurring rules
 * carrying a category *name*, categories already seeded as rows. Using a
 * private in-memory database keeps the legacy schema out of the app's own
 * connection.
 */
function legacyDb(rows: { workspace: string; category: string }[], categoryNames = ["Food & Dining", "Transport", "Other"]) {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE categories (id TEXT NOT NULL, workspace_id TEXT NOT NULL, name TEXT NOT NULL, icon TEXT NOT NULL,
      color TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, builtin INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (workspace_id, id));
    CREATE TABLE transactions (id TEXT NOT NULL, workspace_id TEXT NOT NULL, merchant TEXT NOT NULL, category TEXT NOT NULL,
      account_id TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, note TEXT, PRIMARY KEY (workspace_id, id));
    CREATE TABLE recurring (id TEXT NOT NULL, workspace_id TEXT NOT NULL, merchant TEXT NOT NULL, category TEXT NOT NULL,
      account_id TEXT NOT NULL, type TEXT NOT NULL, amount REAL NOT NULL, frequency TEXT NOT NULL, next_due TEXT NOT NULL,
      active INTEGER NOT NULL, PRIMARY KEY (workspace_id, id));
    CREATE TABLE counters (workspace_id TEXT NOT NULL, kind TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (workspace_id, kind));
  `);
  const workspaces = [...new Set(rows.map((r) => r.workspace))];
  for (const workspace of workspaces) {
    categoryNames.forEach((name, i) => {
      db.prepare("INSERT INTO categories (id, workspace_id, name, icon, color, builtin) VALUES (?, ?, ?, 'category', 'bg-surface-variant', 1)")
        .run(`c${i + 1}`, workspace, name);
    });
    db.prepare("INSERT INTO counters (workspace_id, kind, value) VALUES (?, 'category', ?)").run(workspace, categoryNames.length);
  }
  rows.forEach((row, i) => {
    db.prepare("INSERT INTO transactions (id, workspace_id, merchant, category, account_id, date, amount) VALUES (?, ?, 'M', ?, 'a1', '2026-09-05', -10)")
      .run(`t${i + 1}`, row.workspace, row.category);
    db.prepare("INSERT INTO recurring (id, workspace_id, merchant, category, account_id, type, amount, frequency, next_due, active) VALUES (?, ?, 'M', ?, 'a1', 'expense', 10, 'monthly', '2026-09-09', 1)")
      .run(`r${i + 1}`, row.workspace, row.category);
  });
  return db;
}

const columnsOf = (db: DatabaseSync, table: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[]).map((c) => c.name);

describe("migrating name-keyed categories to ids", () => {
  it("maps every legacy name onto its category id and drops the old column", () => {
    const db = legacyDb([
      { workspace: "ws-a", category: "Food & Dining" },
      { workspace: "ws-a", category: "Transport" },
      { workspace: "ws-b", category: "Transport" },
    ]);

    const report = migrateCategoryReferences(db);

    expect(report).toMatchObject({ moved: { transactions: 3, recurring: 3 }, orphaned: 0, createdCategories: [] });
    const rows = db.prepare("SELECT workspace_id, category_id FROM transactions ORDER BY id").all() as unknown as { workspace_id: string; category_id: string }[];
    expect(rows).toEqual([
      { workspace_id: "ws-a", category_id: "c1" },
      { workspace_id: "ws-a", category_id: "c2" },
      { workspace_id: "ws-b", category_id: "c2" },
    ]);
    expect(columnsOf(db, "transactions")).not.toContain("category");
    expect(columnsOf(db, "recurring")).not.toContain("category");
  });

  it("keeps each workspace's rows pointing at its own categories, never another's", () => {
    const db = legacyDb([
      { workspace: "ws-a", category: "Transport" },
      { workspace: "ws-b", category: "Transport" },
    ]);
    migrateCategoryReferences(db);
    const ids = db.prepare(
      `SELECT t.workspace_id AS ws FROM transactions t
       JOIN categories c ON c.workspace_id = t.workspace_id AND c.id = t.category_id`
    ).all();
    expect(ids).toHaveLength(2); // both resolve *within* their own workspace
  });

  it("creates a category for a name that no longer exists rather than dropping the row", () => {
    const db = legacyDb([{ workspace: "ws-a", category: "Kopi Susu" }]);

    const report = migrateCategoryReferences(db);

    expect(report.createdCategories).toEqual(["Kopi Susu", "Kopi Susu"].slice(0, 1).concat([]));
    expect(report.orphaned).toBe(0);
    const created = db.prepare("SELECT * FROM categories WHERE workspace_id = 'ws-a' AND name = 'Kopi Susu'").get() as { id: string; builtin: number };
    expect(created).toBeDefined();
    expect(created.builtin).toBe(0); // a name outside the defaults stays custom
    expect(db.prepare("SELECT category_id FROM transactions WHERE id = 't1'").get()).toEqual({ category_id: created.id });
  });

  it("leaves no transaction or recurring rule without a category", () => {
    const db = legacyDb([
      { workspace: "ws-a", category: "Food & Dining" },
      { workspace: "ws-a", category: "Was Renamed Away" },
      { workspace: "ws-b", category: "Other" },
    ]);
    migrateCategoryReferences(db);
    expect(findOrphanedCategoryReferences(db)).toEqual([
      { table: "transactions", count: 0 },
      { table: "recurring", count: 0 },
    ]);
  });

  it("is idempotent and a no-op once the legacy column is gone", () => {
    const db = legacyDb([{ workspace: "ws-a", category: "Transport" }]);
    migrateCategoryReferences(db);
    const after = db.prepare("SELECT category_id FROM transactions WHERE id = 't1'").get();
    expect(migrateCategoryReferences(db)).toMatchObject({ moved: { transactions: 0, recurring: 0 }, orphaned: 0 });
    expect(db.prepare("SELECT category_id FROM transactions WHERE id = 't1'").get()).toEqual(after);
  });
});

describe("renaming a category after the migration", () => {
  beforeEach(() => resetWorkspaceForTest());

  it("keeps every past expense, balance and budget attached", () => {
    const account = addAccount(WS, { name: "Main", type: "checking", initialBalance: 1000, color: "" });
    addTransaction(WS, { merchant: "Bus", categoryId: cat("Transport"), accountId: account.id, date: "2026-09-05", amount: -30 });
    addTransaction(WS, { merchant: "Train", categoryId: cat("Transport"), accountId: account.id, date: "2026-09-06", amount: -20 });
    addBudget(WS, { categoryId: cat("Transport"), month: "2026-09", limit: 200, status: "active" });

    const balanceBefore = getAccountsWithBalances(WS)[0].balance;
    const spendingBefore = getMonthlyExpenses(WS, "2026-09");
    const usageBefore = getBudgetUsage(WS, "2026-09")[0];

    updateCategory(WS, cat("Transport"), { name: "Transportasi", icon: "directions_car", color: "bg-pop-blue" });

    expect(getAccountsWithBalances(WS)[0].balance).toBe(balanceBefore);
    expect(getMonthlyExpenses(WS, "2026-09")).toBe(spendingBefore);
    const usageAfter = getBudgetUsage(WS, "2026-09")[0];
    expect(usageAfter.spent).toBe(usageBefore.spent);
    expect(usageAfter.percent).toBe(usageBefore.percent);
    expect(usageAfter.categoryName).toBe("Transportasi");
    // The transactions themselves never moved: same id, same category.
    expect(listTransactions(WS).every((t) => t.categoryId === cat("Transportasi"))).toBe(true);
    expect(listCategories(WS).some((c) => c.name === "Transport")).toBe(false);
  });
});
