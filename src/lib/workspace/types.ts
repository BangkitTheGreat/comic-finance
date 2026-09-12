// "empty" vs "active" is stored explicitly on the workspace row — it is
// never *inferred* from "the transactions table has zero rows for this id",
// which would make an intentionally-cleared workspace indistinguishable from
// one nobody ever put data in, and invite auto-seeding either one.
export type WorkspaceStatus = "empty" | "active";

export interface WorkspaceCounts {
  accounts: number;
  transactions: number;
  budgets: number;
  goals: number;
  bills: number;
  recurring: number;
}
