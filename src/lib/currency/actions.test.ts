import { beforeEach, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { revalidatePath } from "next/cache";
import { changeCurrency } from "./actions";
import { getCurrencyCode, setCurrencyCode } from "./store";
import { listTransactions } from "@/lib/transactions/store";
beforeEach(() => { setCurrencyCode("IDR"); vi.clearAllMocks(); });
it.each(["USD", "EUR", "IDR"])("changes display to %s without changing transaction amounts", async code => {
 const before=structuredClone(listTransactions());const form=new FormData();form.set("code",code);
 expect(await changeCurrency(form)).toEqual({ok:true});expect(getCurrencyCode()).toBe(code);
 expect(listTransactions()).toEqual(before);expect(revalidatePath).toHaveBeenCalledWith("/","layout");
});
it.each(["", "invalid", "__proto__", "constructor"])("rejects invalid currency %s and keeps the current preference",async code=>{
 const form=new FormData();form.set("code",code);expect((await changeCurrency(form)).ok).toBe(false);
 expect(getCurrencyCode()).toBe("IDR");expect(revalidatePath).not.toHaveBeenCalled();
});
