import type { Currency } from "./types";

// Match display rounding, without grouping separators, for HTML number inputs.
// `signed` keeps a leading "-" for fields where sign is meaningful on its own
// (e.g. a credit-card starting balance) rather than shown via a separate
// income/expense toggle.
export function amountInputValue(baseAmount: number, currency: Currency, options: { signed?: boolean } = {}): string {
  const formatted = (Math.abs(baseAmount) * currency.rate).toLocaleString("en-US", {
    useGrouping: false, minimumFractionDigits: currency.fractionDigits,
    maximumFractionDigits: currency.fractionDigits,
  });
  return options.signed && baseAmount < 0 ? `-${formatted}` : formatted;
}
