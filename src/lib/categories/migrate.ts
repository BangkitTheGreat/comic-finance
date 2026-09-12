import type { DatabaseSync } from "node:sqlite";
import { CATEGORIES } from "@/lib/transactions/types";

/** Tables that used to reference a category by its display name. */
const REFERENCING_TABLES = ["transactions", "recurring"] as const;
type ReferencingTable = (typeof REFERENCING_TABLES)[number];

export interface CategoryMigrationReport {
  /** Per table: how many rows were repointed from a name to a category id. */
  moved: Record<ReferencingTable, number>;
  /** Names that had no matching category and were created rather than dropped. */
  createdCategories: string[];
  /** Rows that still have no category after migrating. Must always be 0. */
  orphaned: number;
}

function columnNames(db: DatabaseSync, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[]).map((c) => c.name);
}

function defaultMetaFor(name: string) {
  return CATEGORIES.find((c) => c.name === name) ?? { icon: "category", color: "bg-surface-variant" };
}

/**
 * Counts rows whose category reference does not resolve to a real category.
 * The integrity check the migration is judged by: no transaction and no
 * recurring rule may lose its category.
 */
export function findOrphanedCategoryReferences(db: DatabaseSync): { table: ReferencingTable; count: number }[] {
  return REFERENCING_TABLES.filter((table) => columnNames(db, table).includes("category_id")).map((table) => {
    const { n } = db
      .prepare(
        `SELECT COUNT(*) AS n FROM ${table} t
         WHERE t.category_id IS NULL OR t.category_id = ''
            OR NOT EXISTS (SELECT 1 FROM categories c WHERE c.workspace_id = t.workspace_id AND c.id = t.category_id)`
      )
      .get() as { n: number };
    return { table, count: n };
  });
}

/**
 * Moves transactions and recurring rules from name-keyed categories to
 * `category_id`, per workspace:
 *
 *  1. add the `category_id` column if the table predates it,
 *  2. map each distinct name to that workspace's category, creating one for
 *     any name with no match (a renamed or removed default) so nothing is
 *     silently dropped,
 *  3. verify every row resolves, and refuse to drop the old `category`
 *     column if any does not.
 *
 * Idempotent: once the legacy column is gone there is nothing left to do.
 * Takes the database explicitly so tests can run it against a hand-built
 * legacy schema.
 */
export function migrateCategoryReferences(db: DatabaseSync): CategoryMigrationReport {
  const report: CategoryMigrationReport = { moved: { transactions: 0, recurring: 0 }, createdCategories: [], orphaned: 0 };
  const legacyTables = REFERENCING_TABLES.filter((t) => columnNames(db, t).includes("category"));
  if (legacyTables.length === 0) return report;

  const findCategory = db.prepare("SELECT id FROM categories WHERE workspace_id = ? AND lower(name) = lower(?)");
  const insertCategory = db.prepare(
    "INSERT INTO categories (id, workspace_id, name, icon, color, archived, builtin) VALUES (?, ?, ?, ?, ?, 0, ?)"
  );
  const nextCategoryId = db.prepare(
    "INSERT INTO counters (workspace_id, kind, value) VALUES (?, 'category', 1) ON CONFLICT(workspace_id, kind) DO UPDATE SET value = value + 1 RETURNING value"
  );

  for (const table of legacyTables) {
    if (!columnNames(db, table).includes("category_id")) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN category_id TEXT NOT NULL DEFAULT ''`);
    }
    const pairs = db
      .prepare(`SELECT DISTINCT workspace_id, category FROM ${table} WHERE category_id = '' OR category_id IS NULL`)
      .all() as unknown as { workspace_id: string; category: string }[];

    for (const { workspace_id: workspaceId, category: name } of pairs) {
      let id = (findCategory.get(workspaceId, name) as { id: string } | undefined)?.id;
      if (!id) {
        const { value } = nextCategoryId.get(workspaceId) as { value: number };
        id = `c${value}`;
        const meta = defaultMetaFor(name);
        // A name that matches a default is recreated as builtin; anything
        // else was a user's own category and stays custom.
        const builtin = CATEGORIES.some((c) => c.name === name) ? 1 : 0;
        insertCategory.run(id, workspaceId, name, meta.icon, meta.color, builtin);
        report.createdCategories.push(name);
      }
      const { changes } = db
        .prepare(`UPDATE ${table} SET category_id = ? WHERE workspace_id = ? AND category = ? AND (category_id = '' OR category_id IS NULL)`)
        .run(id, workspaceId, name);
      report.moved[table] += Number(changes);
    }
  }

  report.orphaned = findOrphanedCategoryReferences(db).reduce((sum, r) => sum + r.count, 0);
  if (report.orphaned > 0) {
    // Leave the legacy column in place so the old values are still readable
    // and the migration can be retried after the cause is fixed.
    throw new Error(`Category migration left ${report.orphaned} row(s) without a category; the legacy column was kept.`);
  }
  for (const table of legacyTables) db.exec(`ALTER TABLE ${table} DROP COLUMN category`);
  return report;
}
