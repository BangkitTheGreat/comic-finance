import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import { migrateCategoryReferences } from "@/lib/categories/migrate";
import path from "node:path";

// One SQLite file for every workspace; every table is scoped by a
// `workspace_id` column and every query in the store layer filters on it.
// `node:sqlite` is synchronous, so store functions stay synchronous too —
// only resolving *which* workspace to read (the cookie lookup) is async.
//
// Path is overridable via DATA_DB_PATH so tests can point at ":memory:"
// (a private, per-process database — see vitest.config.ts) instead of the
// real on-disk file.
function resolveDbPath(): string {
  const override = process.env.DATA_DB_PATH;
  if (override) return override;
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "app.db");
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'empty',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  initial_balance REAL NOT NULL,
  color TEXT NOT NULL,
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_ws ON accounts(workspace_id);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  merchant TEXT NOT NULL,
  category_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_transactions_ws ON transactions(workspace_id);
CREATE TABLE IF NOT EXISTS recurring (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  merchant TEXT NOT NULL,
  category_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  frequency TEXT NOT NULL,
  next_due TEXT NOT NULL,
  active INTEGER NOT NULL,
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_recurring_ws ON recurring(workspace_id);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  builtin INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_ws_name ON categories(workspace_id, name);
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  month TEXT NOT NULL,
  limit_amount REAL NOT NULL CHECK (limit_amount > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_budgets_ws_month ON budgets(workspace_id, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_one_per_category_month ON budgets(workspace_id, category_id, month);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  current REAL NOT NULL,
  target REAL NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_color TEXT NOT NULL,
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_goals_ws ON goals(workspace_id);
CREATE TABLE IF NOT EXISTS bills (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  icon TEXT NOT NULL,
  paid INTEGER NOT NULL,
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_bills_ws ON bills(workspace_id);
CREATE TABLE IF NOT EXISTS profiles (
  workspace_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  workspace_id TEXT PRIMARY KEY,
  notify_bills INTEGER NOT NULL,
  notify_budget INTEGER NOT NULL,
  reduce_motion INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS currency (
  workspace_id TEXT PRIMARY KEY,
  code TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS counters (
  workspace_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, kind)
);
`;

// A workspace's "empty"/"active" status must stay true to what's actually in
// its tables no matter which code path inserts a row — a trigger per
// financial table is one place to maintain that, instead of every add*()
// across every domain remembering to flip it. clearWorkspaceFinancialData is
// the only path that flips it back to "empty" (see workspace/store.ts).
const FINANCIAL_TABLE_NAMES = ["accounts", "transactions", "recurring", "budgets", "goals", "bills"];

// Part 3 replaced the name-keyed `budget_categories` table with `budgets`
// (category id + month + explicit paused status). The only database that
// predates it is a local dev file, so there is no data migration: an empty
// legacy table is dropped, a non-empty one is renamed `_legacy` and left
// alone so nothing is silently lost.
// Ids are generated per workspace ("a1" in one workspace, "a1" in another),
// so `id` alone can only be a primary key in a single-workspace database.
// Databases created before this was caught need their per-workspace tables
// rebuilt around PRIMARY KEY (workspace_id, id); SQLite cannot ALTER a
// primary key, so each one is renamed aside, recreated by SCHEMA, and its
// rows copied back.
const WORKSPACE_SCOPED_TABLES = ["accounts", "transactions", "recurring", "categories", "budgets", "goals", "bills"];

function tablesNeedingCompositeKey(database: DatabaseSync): string[] {
  return WORKSPACE_SCOPED_TABLES.filter((table) => {
    const columns = database.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string; pk: number }[];
    if (columns.length === 0) return false; // table does not exist yet
    return !columns.some((c) => c.name === "workspace_id" && c.pk > 0);
  });
}

function migrateToCompositeKeys(database: DatabaseSync, tables: string[]): void {
  for (const table of tables) {
    const columns = (database.prepare(`PRAGMA table_info(${table}_pk_migration)`).all() as unknown as { name: string }[])
      .map((c) => c.name)
      .join(", ");
    database.exec(`INSERT INTO ${table} (${columns}) SELECT ${columns} FROM ${table}_pk_migration`);
    database.exec(`DROP TABLE ${table}_pk_migration`);
  }
}

function retireLegacyBudgetTable(database: DatabaseSync): void {
  const exists = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'budget_categories'")
    .get();
  if (!exists) return;
  const { n } = database.prepare("SELECT COUNT(*) AS n FROM budget_categories").get() as { n: number };
  database.exec(n === 0 ? "DROP TABLE budget_categories" : "ALTER TABLE budget_categories RENAME TO budget_categories_legacy");
}
const ACTIVATION_TRIGGERS = FINANCIAL_TABLE_NAMES.map(
  (table) => `
CREATE TRIGGER IF NOT EXISTS trg_${table}_activate AFTER INSERT ON ${table}
BEGIN
  UPDATE workspaces SET status = 'active' WHERE id = NEW.workspace_id AND status = 'empty';
END;
`
).join("\n");

let db: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(resolveDbPath());
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    retireLegacyBudgetTable(db);
    // Renaming a table carries its triggers along, so drop them first and
    // let ACTIVATION_TRIGGERS recreate them against the rebuilt tables.
    const legacyKeyed = tablesNeedingCompositeKey(db);
    for (const table of FINANCIAL_TABLE_NAMES) db.exec(`DROP TRIGGER IF EXISTS trg_${table}_activate`);
    for (const table of legacyKeyed) db.exec(`ALTER TABLE ${table} RENAME TO ${table}_pk_migration`);
    db.exec(SCHEMA);
    migrateToCompositeKeys(db, legacyKeyed);
    // Part 4: repoint name-keyed transactions/recurring at category ids.
    migrateCategoryReferences(db);
    db.exec(ACTIVATION_TRIGGERS);
  }
  return db;
}

/** Runs `fn` inside a SQLite transaction: every write commits together, or none do. */
export function withTransaction<T>(fn: (database: DatabaseSync) => T): T {
  const database = getDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(database);
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

// Test-only: drop the cached connection so the next getDb() reopens (used
// when a test suite swaps DATA_DB_PATH, or wants a truly fresh schema).
export function resetDbForTest(): void {
  db?.close();
  db = undefined;
}

/**
 * Next id for a record kind within a workspace, e.g. nextId(ws, "account",
 * "a") -> "a1", "a2", ... Per-workspace and per-kind, mirroring the old
 * in-memory `counter` field each store used to keep — just persisted, so a
 * workspace's next id survives a restart instead of colliding with "a1"
 * again after the in-memory counter resets to zero.
 */
export function nextId(workspaceId: string, kind: string, prefix: string): string {
  const database = getDb();
  database
    .prepare(
      "INSERT INTO counters (workspace_id, kind, value) VALUES (?, ?, 1) ON CONFLICT(workspace_id, kind) DO UPDATE SET value = value + 1"
    )
    .run(workspaceId, kind);
  const row = database.prepare("SELECT value FROM counters WHERE workspace_id = ? AND kind = ?").get(workspaceId, kind) as { value: number };
  return `${prefix}${row.value}`;
}
