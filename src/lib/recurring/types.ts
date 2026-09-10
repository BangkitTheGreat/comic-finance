import type { CategoryName } from "@/lib/transactions/types";

export type Frequency = "weekly" | "monthly" | "yearly";

export interface Recurring {
  id: string;
  merchant: string;
  category: CategoryName;
  accountId: string;
  type: "income" | "expense";
  amount: number;
  frequency: Frequency;
  nextDue: string;
  active: boolean;
}

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function advanceDate(iso: string, frequency: Frequency): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (frequency === "weekly") date.setDate(date.getDate() + 7);
  else if (frequency === "monthly") date.setMonth(date.getMonth() + 1);
  else date.setFullYear(date.getFullYear() + 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function isDue(nextDue: string, today = new Date()): boolean {
  const [y, m, d] = nextDue.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return due.getTime() <= start.getTime();
}
