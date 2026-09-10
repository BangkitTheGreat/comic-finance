import { CURRENCIES, CURRENCY_LIST } from "./types";
import { amountInputValue } from "./input";
import { enumField, textField } from "@/lib/form-validation";
import { ValidationError } from "@/lib/action-result";

interface CurrencyAmountOptions {
  /** The base-currency value already on record, for exact-if-unchanged round-tripping. */
  existingBase?: number;
  /** Reject zero and negative amounts. Default true (transactions, recurring). */
  positive?: boolean;
  /** Form field to read. Default "amount". */
  field?: string;
}

// The submitted code describes the form's denomination. Rates are always server-owned.
export function currencyAmountField(form: FormData, options: CurrencyAmountOptions = {}): number {
  const { existingBase, positive = true, field = "amount" } = options;
  const code = enumField(form, "currencyCode", CURRENCY_LIST.map(c => c.code));
  const currency = CURRENCIES[code];
  const raw = textField(form, field);
  const pattern = currency.fractionDigits === 0 ? /^-?\d+$/ : /^-?\d+(?:\.\d{1,2})?$/;
  const value = Number(raw);
  if (!pattern.test(raw) || !Number.isFinite(value) || Math.abs(value) > 1_000_000_000_000) {
    throw new ValidationError(`Enter a valid ${code} amount with ${currency.fractionDigits} decimal places at most (maximum 1 trillion).`, field);
  }
  // Never round-trip an unchanged displayed value: that would introduce FX rounding drift.
  // Also preserves sub-cent legacy values that display as zero in USD/EUR.
  // `positive` callers (transactions, recurring) store a magnitude and apply sign
  // separately, so an unsigned existingBase may itself be negative (a stored expense) —
  // normalize to its magnitude. `positive: false` callers (accounts, budget) store the
  // final signed value directly, so it round-trips as-is.
  if (existingBase !== undefined && Number.isFinite(existingBase) && existingBase !== 0 &&
      value === Number(amountInputValue(existingBase, currency, { signed: !positive }))) {
    return positive ? Math.abs(existingBase) : existingBase;
  }
  if (positive && value <= 0) throw new ValidationError("Enter an amount greater than zero.", field);
  return value / currency.rate;
}
