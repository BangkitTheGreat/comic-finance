import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { CURRENCIES } from "@/lib/currency/types";
import { TransactionFormModal } from "./TransactionFormModal";
import { RecurringFormModal } from "@/components/recurring/RecurringFormModal";

describe("empty account forms", () => {
  it.each([TransactionFormModal, RecurringFormModal])("blocks submitting without offering nonexistent fallback accounts", Component => {
    const html = renderToStaticMarkup(<Component open onClose={() => {}} editing={null} accounts={[]} currency={CURRENCIES.USD} />);
    expect(html).toContain('href="/accounts"');
    expect(html).toMatch(/<fieldset[^>]*disabled/);
    expect(html).not.toContain("<option value=\"a1\"");
    expect(html).toContain('min="0.01"');
  });
});

describe("currency amount inputs", () => {
  it.each([CURRENCIES.USD, CURRENCIES.IDR, CURRENCIES.EUR])("labels and formats transaction input in $code", currency => {
    const html = renderToStaticMarkup(<TransactionFormModal open onClose={() => {}} accounts={[{id:"a1",name:"Test"}]} currency={currency}
      editing={{id:"t",merchant:"Test",category:"Other",accountId:"a1",date:"2026-09-09",amount:-1}} />);
    expect(html).toContain(`Amount (${currency.code})`);
    expect(html).toContain(`name="currencyCode" value="${currency.code}"`);
    expect(html).toContain(`value="${currency.code === "USD" ? "1.00" : currency.code === "IDR" ? "16000" : "0.92"}"`);
    expect(html).toContain(`step="${currency.code === "IDR" ? "1" : "0.01"}"`);
  });
  it("formats recurring IDR input without multiplying an already converted base twice", () => {
    const html=renderToStaticMarkup(<RecurringFormModal open onClose={()=>{}} accounts={[{id:"a1",name:"Test"}]} currency={CURRENCIES.IDR}
      editing={{id:"r",merchant:"Test",category:"Other",accountId:"a1",type:"expense",amount:1,frequency:"monthly",nextDue:"2026-09-09",active:true}} />);
    expect(html).toContain("Amount (IDR)");expect(html).toContain('value="16000"');
  });
});
