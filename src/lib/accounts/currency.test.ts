import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { createAccount, editAccount } from "./actions";
import { getAccount, listAccounts } from "./store";

function form(overrides: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    currencyCode: "USD", name: "Test Account", type: "checking", initialBalance: "1000", ...overrides,
  })) {
    if (value !== undefined) data.set(key, value);
  }
  return data;
}

const byName = (name: string) => listAccounts().find((a) => a.name === name);

beforeEach(() => {
  Reflect.deleteProperty(globalThis, "__accountStore");
  vi.clearAllMocks();
});

describe("account starting balance: currency-aware, sign-aware", () => {
  it("accepts a negative starting balance (e.g. a credit card opened with debt)", async () => {
    const result = await createAccount(form({ initialBalance: "-500", name: "Credit Debt" }));
    expect(result.ok).toBe(true);
    expect(byName("Credit Debt")?.initialBalance).toBe(-500);
  });

  it("accepts a zero starting balance", async () => {
    const result = await createAccount(form({ initialBalance: "0", name: "Zero Start" }));
    expect(result.ok).toBe(true);
    expect(byName("Zero Start")?.initialBalance).toBe(0);
  });

  it("converts a non-USD starting balance into the USD base", async () => {
    await createAccount(form({ currencyCode: "IDR", initialBalance: "16000000", name: "IDR Test" }));
    expect(byName("IDR Test")?.initialBalance).toBeCloseTo(1000, 8);
  });

  it("converts a negative non-USD starting balance correctly (sign survives conversion)", async () => {
    await createAccount(form({ currencyCode: "IDR", initialBalance: "-16000000", name: "IDR Debt" }));
    expect(byName("IDR Debt")?.initialBalance).toBeCloseTo(-1000, 8);
  });

  it("preserves an unchanged negative balance exactly across currency display switches (no FX drift)", async () => {
    const create = await createAccount(form({ initialBalance: "-777.77", name: "Drift Check" }));
    expect(create.ok).toBe(true);
    const account = byName("Drift Check")!;
    const eurDisplay = "-" + (777.77 * 0.92).toFixed(2);
    const edit = await editAccount(form({ id: account.id, currencyCode: "EUR", initialBalance: eurDisplay, name: "Drift Check" }));
    expect(edit.ok).toBe(true);
    expect(getAccount(account.id)?.initialBalance).toBe(-777.77);
  });

  it("rejects a balance beyond the magnitude cap in either direction", async () => {
    expect((await createAccount(form({ initialBalance: "1000000000001" }))).ok).toBe(false);
    expect((await createAccount(form({ initialBalance: "-1000000000001" }))).ok).toBe(false);
  });
});
