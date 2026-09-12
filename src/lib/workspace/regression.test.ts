import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getDb, resetDbForTest } from "@/lib/db/client";
import { clearFinancialData, loadSampleData } from "./actions";
import { clearWorkspaceFinancialData, getWorkspaceCounts, getWorkspaceStatus } from "./store";
import { loadSampleDataInto } from "./sampleData";
import { addAccount, getAccountsWithBalances } from "@/lib/accounts/store";
import { addTransaction, listTransactions } from "@/lib/transactions/store";
import { addRecurring, listRecurring, processDueRecurring } from "@/lib/recurring/store";
import { addBudget, listBudgets } from "@/lib/budget/store";
import { addCategory, getCategoryByName, listCategories } from "@/lib/categories/store";
import { getProfile, updateProfile } from "@/lib/profile/store";
import { todayIso } from "@/lib/dates";
import { OTHER_TEST_WORKSPACE_ID as OTHER, resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "./testing";

const form = (values: Record<string, string> = {}) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
};
const cat = (name: string) => getCategoryByName(WS, name)!.id;

beforeEach(() => {
  resetWorkspaceForTest();
  resetWorkspaceForTest(OTHER);
  vi.clearAllMocks();
});

// Risk 1: the sample data comes back on its own.
describe("a cleared workspace stays cleared", () => {
  const dbFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gwejh-restart-")), "app.db");
  afterAll(() => {
    resetDbForTest();
    process.env.DATA_DB_PATH = ":memory:";
    fs.rmSync(path.dirname(dbFile), { recursive: true, force: true });
  });

  it("survives a server restart, with no auto-seed on the way back up", () => {
    // A real file rather than :memory:, so closing and reopening the
    // connection is the same thing a server restart does.
    process.env.DATA_DB_PATH = dbFile;
    resetDbForTest();
    resetWorkspaceForTest(WS); // the new file starts with no workspace at all

    loadSampleDataInto(WS);
    expect(getWorkspaceCounts(WS).transactions).toBeGreaterThan(0);
    updateProfile(WS, "Agung", "agung@example.com");

    // Called through the store rather than the action so this test does not
    // depend on the cookie mock while DATA_DB_PATH is swapped.
    clearWorkspaceFinancialData(WS);
    expect(getWorkspaceCounts(WS)).toEqual({ accounts: 0, transactions: 0, budgets: 0, goals: 0, bills: 0, recurring: 0 });

    resetDbForTest(); // "restart"
    getDb();

    expect(getWorkspaceCounts(WS)).toEqual({ accounts: 0, transactions: 0, budgets: 0, goals: 0, bills: 0, recurring: 0 });
    expect(getWorkspaceStatus(WS)).toBe("empty");
    expect(listTransactions(WS)).toEqual([]);
    // Preferences are not financial data and outlive the clear and restart.
    expect(getProfile(WS).name).toBe("Agung");
    // Categories stay available as choices, with no amounts attached.
    expect(listCategories(WS).length).toBeGreaterThan(0);
  });

  it("reports zero balances and totals from an empty workspace, not stale numbers", async () => {
    await loadSampleData();
    expect((await clearFinancialData(form({ confirmation: "CLEAR" }))).ok).toBe(true);
    expect(getAccountsWithBalances(WS)).toEqual([]);
    expect(listBudgets(WS, todayIso().slice(0, 7))).toEqual([]);
  });
});

// Risk 2: a recurring rule quietly refills a workspace that was just cleared.
describe("clearing while recurring rules are due", () => {
  it("removes the rules themselves, so processing afterwards posts nothing", async () => {
    const account = addAccount(WS, { name: "Main", type: "checking", initialBalance: 500, color: "" });
    addRecurring(WS, {
      merchant: "Netflix", categoryId: cat("Entertainment"), accountId: account.id,
      type: "expense", amount: 15.99, frequency: "monthly", nextDue: todayIso(), active: true,
    });

    expect((await clearFinancialData(form({ confirmation: "CLEAR" }))).ok).toBe(true);

    expect(listRecurring(WS)).toEqual([]);
    expect(processDueRecurring(WS)).toBe(0);
    expect(listTransactions(WS)).toEqual([]);
    expect(getWorkspaceStatus(WS)).toBe("empty");
  });

  it("keeps the workspace empty even when processing runs immediately before the clear", async () => {
    const account = addAccount(WS, { name: "Main", type: "checking", initialBalance: 500, color: "" });
    addRecurring(WS, {
      merchant: "Gym", categoryId: cat("Health"), accountId: account.id,
      type: "expense", amount: 30, frequency: "monthly", nextDue: todayIso(), active: true,
    });

    expect(processDueRecurring(WS)).toBe(1); // a transaction now exists
    expect((await clearFinancialData(form({ confirmation: "CLEAR" }))).ok).toBe(true);

    expect(getWorkspaceCounts(WS)).toEqual({ accounts: 0, transactions: 0, budgets: 0, goals: 0, bills: 0, recurring: 0 });
    expect(processDueRecurring(WS)).toBe(0);
  });
});

// Risk 3: one workspace's operations reach into another's data.
describe("two workspaces never see each other", () => {
  function seed(workspaceId: string, marker: string) {
    const account = addAccount(workspaceId, { name: marker, type: "checking", initialBalance: 100, color: "" });
    const category = getCategoryByName(workspaceId, "Other")!.id;
    addTransaction(workspaceId, { merchant: marker, categoryId: category, accountId: account.id, date: todayIso(), amount: -10 });
    addBudget(workspaceId, { categoryId: category, month: todayIso().slice(0, 7), limit: 50, status: "active" });
    addRecurring(workspaceId, {
      merchant: marker, categoryId: category, accountId: account.id,
      type: "expense", amount: 5, frequency: "monthly", nextDue: "2099-01-01", active: true,
    });
  }

  it("clearing one workspace leaves the other's data completely intact", async () => {
    seed(WS, "mine");
    seed(OTHER, "theirs");
    const theirCounts = getWorkspaceCounts(OTHER);

    expect((await clearFinancialData(form({ confirmation: "CLEAR" }))).ok).toBe(true);

    expect(getWorkspaceCounts(WS)).toEqual({ accounts: 0, transactions: 0, budgets: 0, goals: 0, bills: 0, recurring: 0 });
    expect(getWorkspaceCounts(OTHER)).toEqual(theirCounts);
    expect(listTransactions(OTHER)).toHaveLength(1);
    expect(getWorkspaceStatus(OTHER)).toBe("active");
  });

  it("loading sample data into an empty workspace does not touch a populated neighbour", async () => {
    seed(OTHER, "theirs");
    const theirs = structuredClone(listTransactions(OTHER));

    expect((await loadSampleData()).ok).toBe(true);

    expect(listTransactions(OTHER)).toEqual(theirs);
    expect(getWorkspaceCounts(WS).transactions).toBeGreaterThan(0);
  });

  it("gives each workspace its own ids, so identical ids never collide", () => {
    const mine = addAccount(WS, { name: "Mine", type: "cash", initialBalance: 1, color: "" });
    const theirs = addAccount(OTHER, { name: "Theirs", type: "cash", initialBalance: 2, color: "" });
    expect(mine.id).toBe(theirs.id); // same per-workspace counter value
    expect(getAccountsWithBalances(WS).find((a) => a.id === mine.id)?.name).toBe("Mine");
    expect(getAccountsWithBalances(OTHER).find((a) => a.id === theirs.id)?.name).toBe("Theirs");
  });

  it("keeps custom categories and their spending private", () => {
    const mine = addCategory(WS, { name: "Kopi", icon: "local_cafe", color: "bg-pop-pink" });
    expect(getCategoryByName(OTHER, "Kopi")).toBeUndefined();
    expect(listCategories(OTHER).some((c) => c.id === mine.id && c.name === "Kopi")).toBe(false);
  });
});
