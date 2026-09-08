export type CurrencyCode = "USD" | "IDR" | "EUR";

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  rate: number; // multiplier relative to the USD base the stores use
  fractionDigits: number;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: "USD", symbol: "$", locale: "en-US", rate: 1, fractionDigits: 2 },
  IDR: { code: "IDR", symbol: "Rp", locale: "id-ID", rate: 16000, fractionDigits: 0 },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE", rate: 0.92, fractionDigits: 2 },
};

export const CURRENCY_LIST: Currency[] = Object.values(CURRENCIES);

export function getCurrencyByCode(code: string): Currency {
  return CURRENCIES[code as CurrencyCode] ?? CURRENCIES.USD;
}

// amount is in the USD base. Converts to the target currency then formats.
export function formatMoney(amount: number, currency: Currency): string {
  const converted = amount * currency.rate;
  const sign = converted < 0 ? "-" : "";
  const body = Math.abs(converted).toLocaleString(currency.locale, {
    minimumFractionDigits: currency.fractionDigits,
    maximumFractionDigits: currency.fractionDigits,
  });
  return `${sign}${currency.symbol}${body}`;
}

// Same as formatMoney but without a sign for the negative (caller adds +/-).
export function formatMoneyAbs(amount: number, currency: Currency): string {
  const converted = Math.abs(amount) * currency.rate;
  return `${currency.symbol}${converted.toLocaleString(currency.locale, {
    minimumFractionDigits: currency.fractionDigits,
    maximumFractionDigits: currency.fractionDigits,
  })}`;
}
