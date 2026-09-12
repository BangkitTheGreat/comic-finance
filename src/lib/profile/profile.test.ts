import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { editProfile, resetDemoData } from "./actions";
import { getProfile, resetAllData, updateProfile } from "./store";
import { profileInitials } from "./initials";
import { toggleSetting } from "@/lib/settings/actions";
import { getSettings } from "@/lib/settings/store";
import { listGoals, updateGoal } from "@/lib/goals/store";
import { listBills, updateBill } from "@/lib/bills/store";
import { getAccountsWithBalances } from "@/lib/accounts/store";

function form(values: Record<string, string | Blob>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => resetAllData());

describe("profile mutation boundary", () => {
  it.each([
    { name: " ", email: "penny@example.com" },
    { name: "x".repeat(81), email: "penny@example.com" },
    { name: "Two\nLines", email: "penny@example.com" },
    { name: "Penny", email: "invalid@address" },
    { name: new Blob(["Penny"]), email: "penny@example.com" },
  ])("rejects invalid input without changing the profile: %j", async values => {
    const original = getProfile();
    expect((await editProfile(form(values))).ok).toBe(false);
    expect(getProfile()).toEqual(original);
  });
  it("normalizes valid fields and keeps previously read profiles unchanged", async () => {
    const before = getProfile();
    expect((await editProfile(form({ name: "  Agung Putra  ", email: "  agung@example.com " }))).ok).toBe(true);
    expect(getProfile()).toEqual({ name: "Agung Putra", email: "agung@example.com" });
    expect(before.name).toBe("Penny User");
    const copy = getProfile();
    copy.name = "Outside mutation";
    expect(getProfile().name).toBe("Agung Putra");
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
    const before = { ...getSettings() };
    expect((await toggleSetting(form(values))).ok).toBe(false);
    expect(getSettings()).toEqual(before);
  });
  it("sets the requested value idempotently without touching balances", async () => {
    const balances = getAccountsWithBalances();
    for (let i = 0; i < 2; i++) expect((await toggleSetting(form({ key: "reduceMotion", value: "true" }))).ok).toBe(true);
    expect(getSettings().reduceMotion).toBe(true);
    expect(getAccountsWithBalances()).toEqual(balances);
  });
});

describe("demo reset", () => {
  it.each([{}, { confirmation: "reset" }, { confirmation: "DELETE" }, { confirmation: new Blob(["RESET"]) }])("requires explicit server-side confirmation: %j", async values => {
    updateProfile("Keep me", "keep@example.com");
    const finances = getAccountsWithBalances();
    expect((await resetDemoData(form(values))).ok).toBe(false);
    expect(getProfile().name).toBe("Keep me");
    expect(getAccountsWithBalances()).toEqual(finances);
  });
  it("clears all demo stores and restores seeds even after editing goals and bills", async () => {
    const goals = structuredClone(listGoals());
    const bills = structuredClone(listBills());
    updateGoal(goals[0].id, { name: "Changed goal", current: 1 });
    updateBill(bills[0].id, { name: "Changed bill", paid: true });
    updateProfile("Changed", "changed@example.com");
    await toggleSetting(form({ key: "reduceMotion", value: "true" }));
    getAccountsWithBalances();
    expect((await resetDemoData(form({ confirmation: "RESET" }))).ok).toBe(true);
    for (const key of ["__txStore", "__accountStore", "__goalStore", "__billStore", "__recurringStore", "__budgetStore", "__profileStore", "__currencyStore", "__settingsStore"]) {
      expect(Reflect.has(globalThis, key)).toBe(false);
    }
    expect(listGoals()).toEqual(goals);
    expect(listBills()).toEqual(bills);
    expect(getProfile().name).toBe("Penny User");
    expect(getSettings().reduceMotion).toBe(false);
  });
});
