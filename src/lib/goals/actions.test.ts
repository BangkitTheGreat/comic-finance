import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { contributeGoal, createGoal, deleteGoal, editGoal } from "./actions";
import { addGoal, getGoal, listGoals } from "./store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ currencyCode: "USD", name: "Japan Trip", target: "5000", icon: "flight_takeoff", ...overrides })) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}
const newGoal = () => addGoal(WS, { name: "Trip", current: 100, target: 1000, icon: "flight_takeoff", color: "text-primary", bgColor: "bg-primary" });

beforeEach(() => {
  resetWorkspaceForTest();
  vi.clearAllMocks();
});

describe("goal amounts are currency-aware", () => {
  it("creates a goal with a target and optional starting amount", async () => {
    expect(await createGoal(form({ current: "250" }))).toEqual({ ok: true });
    expect(listGoals(WS)[0]).toMatchObject({ name: "Japan Trip", target: 5000, current: 250, icon: "flight_takeoff" });
  });

  it("converts a non-USD target into the USD base", async () => {
    expect(await createGoal(form({ currencyCode: "IDR", target: "80000000" }))).toEqual({ ok: true });
    expect(listGoals(WS)[0].target).toBeCloseTo(5000, 8);
  });

  it("preserves the exact base target when an unchanged display is saved again", async () => {
    const goal = newGoal();
    expect(await editGoal(form({ id: goal.id, name: "Trip", currencyCode: "EUR", target: (1000 * 0.92).toFixed(2) }))).toEqual({ ok: true });
    expect(getGoal(WS, goal.id)?.target).toBe(1000);
  });

  it("defaults the starting amount to zero when the field is left out", async () => {
    expect(await createGoal(form())).toEqual({ ok: true });
    expect(listGoals(WS)[0].current).toBe(0);
  });
});

describe("goal input boundary", () => {
  it.each(["0", "-100", "NaN", "", " ", "1e309", "1000000000001"])("rejects target %s without creating anything", async (target) => {
    expect((await createGoal(form({ target }))).ok).toBe(false);
    expect(listGoals(WS)).toEqual([]);
  });

  it.each([{ name: " " }, { icon: "rocket" }, { currencyCode: "XXX" }, { current: "-50" }])("rejects invalid fields %j", async (overrides) => {
    expect((await createGoal(form(overrides))).ok).toBe(false);
    expect(listGoals(WS)).toEqual([]);
  });

  it("reports missing records instead of throwing", async () => {
    for (const action of [editGoal, deleteGoal]) {
      expect((await action(form({ id: "missing" }))).ok).toBe(false);
    }
    expect((await contributeGoal(form({ id: "missing", amount: "10", direction: "add" }))).ok).toBe(false);
  });
});

describe("contributing to a goal", () => {
  it("adds and withdraws by an explicit direction rather than a typed minus sign", async () => {
    const goal = newGoal();
    expect(await contributeGoal(form({ id: goal.id, amount: "250", direction: "add" }))).toEqual({ ok: true });
    expect(getGoal(WS, goal.id)?.current).toBe(350);
    expect(await contributeGoal(form({ id: goal.id, amount: "50", direction: "withdraw" }))).toEqual({ ok: true });
    expect(getGoal(WS, goal.id)?.current).toBe(300);
  });

  it("never drives a goal below zero", async () => {
    const goal = newGoal();
    expect(await contributeGoal(form({ id: goal.id, amount: "9999", direction: "withdraw" }))).toEqual({ ok: true });
    expect(getGoal(WS, goal.id)?.current).toBe(0);
  });

  it.each([{ amount: "0" }, { amount: "-10" }, { amount: "abc" }, { direction: "sideways" }])(
    "rejects invalid contributions %j without changing the balance",
    async (overrides) => {
      const goal = newGoal();
      const result = await contributeGoal(form({ id: goal.id, amount: "10", direction: "add", ...overrides }));
      expect(result.ok).toBe(false);
      expect(getGoal(WS, goal.id)?.current).toBe(100);
    }
  );

  it("converts a non-USD contribution once", async () => {
    const goal = newGoal();
    expect(await contributeGoal(form({ id: goal.id, currencyCode: "IDR", amount: "1600000", direction: "add" }))).toEqual({ ok: true });
    expect(getGoal(WS, goal.id)?.current).toBeCloseTo(200, 8);
  });
});
