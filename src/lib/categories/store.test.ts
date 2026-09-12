import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { addCategory, ensureBuiltinCategories, getCategoryByName, listCategories } from "./store";
import { createCategory } from "./actions";
import { CATEGORIES, CATEGORY_NAMES } from "@/lib/transactions/types";
import { clearWorkspaceFinancialData } from "@/lib/workspace/store";
import { OTHER_TEST_WORKSPACE_ID as OTHER, resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries({ name: "Coffee", icon: "local_cafe", color: "bg-pop-pink", ...values })) data.set(k, v);
  return data;
}

beforeEach(() => {
  resetWorkspaceForTest();
  resetWorkspaceForTest(OTHER);
});

describe("builtin categories", () => {
  it("seeds every default category as a row with a stable id, in order", () => {
    const seeded = listCategories(WS);
    expect(seeded.map((c) => c.name)).toEqual([...CATEGORY_NAMES].sort());
    expect(seeded.every((c) => c.builtin && !c.archived)).toBe(true);
    // Deterministic ids on a fresh workspace: c1..c9 in CATEGORIES order.
    expect(getCategoryByName(WS, CATEGORIES[0].name)?.id).toBe("c1");
    expect(getCategoryByName(WS, CATEGORIES[CATEGORIES.length - 1].name)?.id).toBe(`c${CATEGORIES.length}`);
  });

  it("is idempotent — re-running never duplicates or renumbers", () => {
    const before = listCategories(WS).map((c) => c.id);
    ensureBuiltinCategories(WS);
    ensureBuiltinCategories(WS);
    expect(listCategories(WS).map((c) => c.id)).toEqual(before);
  });

  it("survives clearing financial data — categories are configuration, not amounts", () => {
    addCategory(WS, { name: "Coffee", icon: "local_cafe", color: "bg-pop-pink" });
    clearWorkspaceFinancialData(WS);
    expect(listCategories(WS)).toHaveLength(CATEGORIES.length + 1);
    expect(getCategoryByName(WS, "Coffee")).toBeDefined();
  });
});

describe("createCategory", () => {
  it("adds a custom category with name, icon and color", async () => {
    expect(await createCategory(form({}))).toEqual({ ok: true });
    expect(getCategoryByName(WS, "coffee")).toMatchObject({ name: "Coffee", icon: "local_cafe", color: "bg-pop-pink", builtin: false, archived: false });
  });

  it("rejects a duplicate name regardless of case", async () => {
    expect(await createCategory(form({ name: "transport" }))).toMatchObject({ ok: false, errors: { name: expect.stringContaining("already exists") } });
    await createCategory(form({ name: "Coffee" }));
    expect(await createCategory(form({ name: "COFFEE" }))).toMatchObject({ ok: false, errors: { name: expect.any(String) } });
    expect(listCategories(WS)).toHaveLength(CATEGORIES.length + 1);
  });

  it.each<Record<string, string>>([
    { name: " " },
    { name: "x".repeat(41) },
    { icon: "not-an-icon" },
    { color: "bg-evil" },
    { icon: "<script>" },
  ])("rejects invalid input %j without adding anything", async (values) => {
    expect((await createCategory(form(values))).ok).toBe(false);
    expect(listCategories(WS)).toHaveLength(CATEGORIES.length);
  });
});

describe("workspace isolation", () => {
  it("keeps custom categories private to the workspace that made them", () => {
    addCategory(WS, { name: "Coffee", icon: "local_cafe", color: "bg-pop-pink" });
    expect(getCategoryByName(OTHER, "Coffee")).toBeUndefined();
    expect(listCategories(OTHER)).toHaveLength(CATEGORIES.length);
  });
});
