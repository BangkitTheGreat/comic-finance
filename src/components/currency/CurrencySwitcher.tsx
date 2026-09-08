"use client";

import { CURRENCY_LIST, type CurrencyCode } from "@/lib/currency/types";
import { changeCurrency } from "@/lib/currency/actions";

interface Props {
  current: CurrencyCode;
  variant?: "sidebar" | "settings";
}

export function CurrencySwitcher({ current, variant = "sidebar" }: Props) {
  if (variant === "settings") {
    return (
      <form action={changeCurrency} className="flex items-center gap-3">
        <select
          name="code"
          defaultValue={current}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          aria-label="Display currency"
          className="flex-1 bg-surface-container-low border-2 border-border-heavy rounded-lg p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
        >
          {CURRENCY_LIST.map((c) => (
            <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
          ))}
        </select>
      </form>
    );
  }

  return (
    <form action={changeCurrency} className="px-2">
      <label className="flex items-center gap-2 border-2 border-border-heavy rounded-lg px-3 py-2 bg-surface-container-low comic-interactive shadow-comic-sm cursor-pointer">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">paid</span>
        <select
          name="code"
          defaultValue={current}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          aria-label="Display currency"
          className="flex-1 bg-transparent font-label-md text-ink focus:outline-none cursor-pointer"
        >
          {CURRENCY_LIST.map((c) => (
            <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
          ))}
        </select>
      </label>
    </form>
  );
}
