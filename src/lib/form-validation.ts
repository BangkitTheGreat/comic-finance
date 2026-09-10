import { ValidationError } from "./action-result";
import { isPositiveAmount, isValidIsoDate } from "./validation";

export function textField(form: FormData, field: string, required = true): string {
  const raw = form.get(field);
  if (raw !== null && typeof raw !== "string") throw new ValidationError("Enter text, not a file.", field);
  const value = (raw ?? "").trim();
  if (required && !value) throw new ValidationError("This field is required.", field);
  if (value.length > 1000) throw new ValidationError("Use at most 1000 characters.", field);
  return value;
}
export function enumField<T extends string>(form: FormData, field: string, allowed: readonly T[]): T {
  const value = textField(form, field);
  if (!allowed.includes(value as T)) throw new ValidationError("Select a valid option.", field);
  return value as T;
}
export function amountField(form: FormData, field = "amount", positive = true): number {
  const raw = textField(form, field);
  const amount = Number(raw);
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(raw) || !Number.isFinite(amount) ||
      Math.abs(amount) > 1_000_000_000_000 || (positive && !isPositiveAmount(amount))) {
    throw new ValidationError(positive ? "Enter a positive amount with at most 2 decimal places (maximum 1 trillion)." : "Enter a valid balance with at most 2 decimal places (maximum magnitude 1 trillion).", field);
  }
  return amount;
}
export function dateField(form: FormData, field: string): string {
  const value = textField(form, field);
  if (!isValidIsoDate(value)) throw new ValidationError("Enter a valid date (YYYY-MM-DD).", field);
  return value;
}
