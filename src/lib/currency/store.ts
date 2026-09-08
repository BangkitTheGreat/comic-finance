import type { CurrencyCode } from "./types";
import { getCurrencyByCode, type Currency } from "./types";

interface Store {
  code: CurrencyCode;
}

const globalForStore = globalThis as unknown as { __currencyStore?: Store };

function getStore(): Store {
  if (!globalForStore.__currencyStore) {
    globalForStore.__currencyStore = { code: "USD" };
  }
  return globalForStore.__currencyStore;
}

export function getCurrencyCode(): CurrencyCode {
  return getStore().code;
}

export function getActiveCurrency(): Currency {
  return getCurrencyByCode(getStore().code);
}

export function setCurrencyCode(code: CurrencyCode): void {
  getStore().code = code;
}
