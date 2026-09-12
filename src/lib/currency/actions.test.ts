import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "test-workspace" }) }) }));
import { revalidatePath } from "next/cache";
import { changeCurrency } from "./actions";
import { getCurrencyCode, setCurrencyCode } from "./store";
import { listTransactions } from "@/lib/transactions/store";
import { resetWorkspaceForTest, TEST_WORKSPACE_ID as WS } from "@/lib/workspace/testing";

beforeEach(() => {
  resetWorkspaceForTest();
  setCurrencyCode(WS, "IDR");
  vi.clearAllMocks();
});
it.each(["USD", "EUR", "IDR"])("changes display to %s without changing transaction amounts", async code => {
 const before=structuredClone(listTransactions(WS));const form=new FormData();form.set("code",code);
 expect(await changeCurrency(form)).toEqual({ok:true});expect(getCurrencyCode(WS)).toBe(code);
 expect(listTransactions(WS)).toEqual(before);expect(revalidatePath).toHaveBeenCalledWith("/","layout");
});
it.each(["", "invalid", "__proto__", "constructor"])("rejects invalid currency %s and keeps the current preference",async code=>{
 const form=new FormData();form.set("code",code);expect((await changeCurrency(form)).ok).toBe(false);
 expect(getCurrencyCode(WS)).toBe("IDR");expect(revalidatePath).not.toHaveBeenCalled();
});
