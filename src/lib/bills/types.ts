export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  icon: string;
  paid: boolean;
}

export type BillStatus = "paid" | "overdue" | "upcoming";

export interface BillTheme {
  icon: string;
}

export const BILL_ICONS: string[] = [
  "wifi",
  "bolt",
  "water_drop",
  "phone_iphone",
  "home",
  "directions_car",
  "subscriptions",
  "credit_card",
];

const DAY_MS = 1000 * 60 * 60 * 24;

export function getBillStatus(bill: Bill, today = new Date()): BillStatus {
  if (bill.paid) return "paid";
  const due = new Date(bill.dueDate + "T00:00:00");
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return due.getTime() < start.getTime() ? "overdue" : "upcoming";
}

export function daysUntil(dueDate: string, today = new Date()): number {
  const due = new Date(dueDate + "T00:00:00");
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due.getTime() - start.getTime()) / DAY_MS);
}

export function formatDueLabel(bill: Bill, today = new Date()): string {
  const status = getBillStatus(bill, today);
  if (status === "paid") return "Paid";
  const diff = daysUntil(bill.dueDate, today);
  if (diff === 0) return "Due Today";
  if (diff < 0) return `Due ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`;
  return `Due in ${diff} day${diff === 1 ? "" : "s"}`;
}
