import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { createBill, deleteBill, editBill, payBill, unpayBill } from "./actions";
import { addBill, getBill, listBills } from "./store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ currencyCode: "USD", name: "Internet", amount: "79.99", dueDate: "2026-09-20", icon: "wifi", ...overrides })) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  resetWorkspaceForTest();
  vi.clearAllMocks();
});

describe("bill amounts are currency-aware", () => {
  it("stores a USD amount as entered", async () => {
    expect(await createBill(form())).toEqual({ ok: true });
    expect(listBills(WS)[0]).toMatchObject({ name: "Internet", amount: 79.99, dueDate: "2026-09-20", paid: false });
  });

  it.each<[string, string, number]>([
    ["IDR", "16000000", 1000],
    ["EUR", "92", 100],
  ])("converts a %s amount into the USD base once", async (currencyCode, amount, expected) => {
    expect(await createBill(form({ currencyCode, amount }))).toEqual({ ok: true });
    expect(listBills(WS)[0].amount).toBeCloseTo(expected, 8);
  });

  it("preserves the exact base value when an unchanged display is saved again", async () => {
    const bill = addBill(WS, { name: "Water", amount: 45, dueDate: "2026-09-10", icon: "water_drop", paid: false });
    const eurDisplay = (45 * 0.92).toFixed(2);
    expect(await editBill(form({ id: bill.id, name: "Water", currencyCode: "EUR", amount: eurDisplay, dueDate: "2026-09-10", icon: "water_drop" }))).toEqual({ ok: true });
    expect(getBill(WS, bill.id)?.amount).toBe(45);
  });
});

describe("bill input boundary", () => {
  it.each(["0", "-5", "NaN", "Infinity", "", " ", "1e309", "1000000000001", "0.001"])(
    "rejects amount %s without creating anything",
    async (amount) => {
      expect((await createBill(form({ amount }))).ok).toBe(false);
      expect(listBills(WS)).toEqual([]);
    }
  );

  it.each([{ name: " " }, { dueDate: "2026-02-31" }, { dueDate: "bad" }, { icon: "skull" }, { currencyCode: "XXX" }])(
    "rejects invalid fields %j",
    async (overrides) => {
      expect((await createBill(form(overrides))).ok).toBe(false);
      expect(listBills(WS)).toEqual([]);
    }
  );

  it("reports missing records instead of throwing", async () => {
    for (const action of [editBill, deleteBill, payBill, unpayBill]) {
      expect((await action(form({ id: "missing" }))).ok).toBe(false);
    }
  });
});

describe("paying a bill", () => {
  it("toggles paid without touching the amount or due date", async () => {
    const bill = addBill(WS, { name: "Power", amount: 124.5, dueDate: "2026-09-15", icon: "bolt", paid: false });
    expect(await payBill(form({ id: bill.id }))).toEqual({ ok: true });
    expect(getBill(WS, bill.id)).toMatchObject({ paid: true, amount: 124.5, dueDate: "2026-09-15" });
    expect(await unpayBill(form({ id: bill.id }))).toEqual({ ok: true });
    expect(getBill(WS, bill.id)?.paid).toBe(false);
  });
});
