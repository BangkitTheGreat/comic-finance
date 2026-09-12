import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { editProfile } from "./actions";
import { getProfile, updateProfile } from "./store";
import { profileInitials } from "./initials";
import { toggleSetting } from "@/lib/settings/actions";
import { getSettings } from "@/lib/settings/store";
import { listGoals, updateGoal } from "@/lib/goals/store";
import { listBills, updateBill } from "@/lib/bills/store";
import { getAccountsWithBalances, addAccount } from "@/lib/accounts/store";
import { addTransaction } from "@/lib/transactions/store";
import { addGoal } from "@/lib/goals/store";
import { addBill } from "@/lib/bills/store";
import { clearFinancialData, loadSampleData } from "@/lib/workspace/actions";
import { getWorkspaceStatus, getWorkspaceCounts } from "@/lib/workspace/store";
import { getCategoryByName } from "@/lib/categories/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

const cat = (name: string) => getCategoryByName(WS, name)!.id;


function form(values: Record<string, string | Blob>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => resetWorkspaceForTest());

describe("profile mutation boundary", () => {
  it.each([
    { name: " ", email: "penny@example.com" },
    { name: "x".repeat(81), email: "penny@example.com" },
    { name: "Two\nLines", email: "penny@example.com" },
    { name: "Penny", email: "invalid@address" },
    { name: new Blob(["Penny"]), email: "penny@example.com" },
  ])("rejects invalid input without changing the profile: %j", async values => {
    const original = getProfile(WS);
    expect((await editProfile(form(values))).ok).toBe(false);
    expect(getProfile(WS)).toEqual(original);
  });
  it("normalizes valid fields and keeps previously read profiles unchanged", async () => {
    const before = getProfile(WS);
    expect((await editProfile(form({ name: "  Agung Putra  ", email: "  agung@example.com " }))).ok).toBe(true);
    expect(getProfile(WS)).toEqual({ name: "Agung Putra", email: "agung@example.com" });
    expect(before.name).toBe("Penny User");
    const copy = getProfile(WS);
    copy.name = "Outside mutation";
    expect(getProfile(WS).name).toBe("Agung Putra");
  });
  it("derives local initials for empty, Unicode and multiword names", () => {
    expect(profileInitials(" ")).toBe("PU");
    expect(profileInitials("Agung")).toBe("A");
    expect(profileInitials("  Agung Budi Putra ")).toBe("AP");
    expect(profileInitials("Émile 王")).toBe("É王");
  });
});

describe("settings boundary", () => {
  it.each([
    { key: "__proto__", value: "true" },
    { key: "notifyGoals", value: "true" },
    { key: "reduceMotion", value: "yes" },
    { key: "reduceMotion", value: new Blob(["true"]) },
  ])("rejects unknown keys and invalid booleans: %j", async values => {
    const before = { ...getSettings(WS) };
    expect((await toggleSetting(form(values))).ok).toBe(false);
    expect(getSettings(WS)).toEqual(before);
  });
  it("sets the requested value idempotently without touching balances", async () => {
    const balances = getAccountsWithBalances(WS);
    for (let i = 0; i < 2; i++) expect((await toggleSetting(form({ key: "reduceMotion", value: "true" }))).ok).toBe(true);
    expect(getSettings(WS).reduceMotion).toBe(true);
    expect(getAccountsWithBalances(WS)).toEqual(balances);
  });
});

describe("clear financial data", () => {
  it.each<Record<string, string | Blob>>([{}, { confirmation: "clear" }, { confirmation: "DELETE" }, { confirmation: new Blob(["CLEAR"]) }])(
    "requires explicit server-side confirmation: %j",
    async values => {
      updateProfile(WS, "Keep me", "keep@example.com");
      addAccount(WS, { name: "Keep", type: "checking", initialBalance: 100, color: "" });
      const finances = getAccountsWithBalances(WS);
      expect((await clearFinancialData(form(values))).ok).toBe(false);
      expect(getProfile(WS).name).toBe("Keep me");
      expect(getAccountsWithBalances(WS)).toEqual(finances);
    }
  );

  it("empties every financial table but leaves profile and settings untouched", async () => {
    const account = addAccount(WS, { name: "Checking", type: "checking", initialBalance: 100, color: "" });
    addTransaction(WS, { merchant: "Coffee", categoryId: cat("Other"), accountId: account.id, date: "2026-09-01", amount: -5 });
    const goal = addGoal(WS, { name: "Trip", current: 0, target: 100, icon: "flight_takeoff", color: "", bgColor: "" });
    const bill = addBill(WS, { name: "Internet", amount: 50, dueDate: "2026-09-20", icon: "wifi", paid: false });
    updateGoal(WS, goal.id, { current: 10 });
    updateBill(WS, bill.id, { paid: true });
    updateProfile(WS, "Changed", "changed@example.com");
    await toggleSetting(form({ key: "reduceMotion", value: "true" }));

    expect(getWorkspaceStatus(WS)).not.toBe("empty");
    expect((await clearFinancialData(form({ confirmation: "CLEAR" }))).ok).toBe(true);

    expect(getAccountsWithBalances(WS)).toEqual([]);
    expect(listGoals(WS)).toEqual([]);
    expect(listBills(WS)).toEqual([]);
    expect(getWorkspaceCounts(WS)).toEqual({ accounts: 0, transactions: 0, budgets: 0, goals: 0, bills: 0, recurring: 0 });
    expect(getWorkspaceStatus(WS)).toBe("empty");
    // Profile and settings are preferences, not financial data — Clear must not touch them.
    expect(getProfile(WS).name).toBe("Changed");
    expect(getSettings(WS).reduceMotion).toBe(true);
  });

  it("stays empty after a second clear (idempotent, no crash on nothing to delete)", async () => {
    expect((await clearFinancialData(form({ confirmation: "CLEAR" }))).ok).toBe(true);
    expect((await clearFinancialData(form({ confirmation: "CLEAR" }))).ok).toBe(true);
    expect(getWorkspaceStatus(WS)).toBe("empty");
  });
});

describe("load sample data", () => {
  it("fills an empty workspace and marks it seeded", async () => {
    expect(getWorkspaceStatus(WS)).toBe("empty");
    expect((await loadSampleData()).ok).toBe(true);
    const counts = getWorkspaceCounts(WS);
    expect(counts.accounts).toBeGreaterThan(0);
    expect(counts.transactions).toBeGreaterThan(0);
    expect(getWorkspaceStatus(WS)).toBe("active");
  });

  it("refuses to run again once the workspace already has data, so it never silently overwrites it", async () => {
    expect((await loadSampleData()).ok).toBe(true);
    addAccount(WS, { name: "My own account", type: "checking", initialBalance: 42, color: "" });
    const before = getWorkspaceCounts(WS);
    const result = await loadSampleData();
    expect(result.ok).toBe(false);
    expect(getWorkspaceCounts(WS)).toEqual(before);
  });

  it("is available again after a clear", async () => {
    await loadSampleData();
    await clearFinancialData(form({ confirmation: "CLEAR" }));
    expect(getWorkspaceStatus(WS)).toBe("empty");
    expect((await loadSampleData()).ok).toBe(true);
  });
});
