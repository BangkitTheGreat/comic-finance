import { listTransactions } from "./store";
import { getAccountsWithBalances } from "@/lib/accounts/store";
import { currentMonth, toIsoMonth } from "@/lib/dates";
import type { Transaction } from "./types";

export function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface AccountSummary {
  name: string;
  balance: number;
  color: string;
}

export function getAccountSummaries(): AccountSummary[] {
  return getAccountsWithBalances().map((a) => ({
    name: a.name,
    balance: a.balance,
    color: a.color,
  }));
}

export function getTotalBalance(): number {
  return getAccountsWithBalances().reduce((s, a) => s + a.balance, 0);
}

export function getMonthlyIncome(month = currentMonth()): number {
  return listTransactions()
    .filter((t) => t.date.startsWith(month) && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
}

export function getMonthlyExpenses(month = currentMonth()): number {
  return listTransactions()
    .filter((t) => t.date.startsWith(month) && t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
}

export function getRecentTransactions(limit = 4): Transaction[] {
  return listTransactions().slice(0, limit);
}

export interface DashboardOverview {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accounts: AccountSummary[];
}

export function getDashboardOverview(): DashboardOverview {
  return {
    totalBalance: getTotalBalance(),
    monthlyIncome: getMonthlyIncome(),
    monthlyExpenses: getMonthlyExpenses(),
    accounts: getAccountSummaries(),
  };
}

export function getCategorySpending(month = currentMonth()): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of listTransactions()) {
    if (tx.date.startsWith(month) && tx.amount < 0) {
      map.set(tx.category, (map.get(tx.category) ?? 0) + Math.abs(tx.amount));
    }
  }
  return map;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
}

export function getMonthlySeries(count = 3): MonthlyPoint[] {
  const now = new Date();
  const points: MonthlyPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toIsoMonth(d);
    points.push({
      month: key,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      income: getMonthlyIncome(key),
      expense: getMonthlyExpenses(key),
    });
  }
  return points;
}

export function getNetSavings(month = currentMonth()): number {
  return getMonthlyIncome(month) - getMonthlyExpenses(month);
}

export type StatsRange = "month" | "quarter" | "year";

export interface RangeStats {
  series: MonthlyPoint[];
  net: number;
  income: number;
  expense: number;
}

export function getStatsForRange(range: StatsRange): RangeStats {
  const months = range === "month" ? 3 : range === "quarter" ? 6 : 12;
  const window = range === "month" ? 1 : range === "quarter" ? 3 : 12;
  const series = getMonthlySeries(months);
  const recent = series.slice(-window);
  const income = recent.reduce((s, p) => s + p.income, 0);
  const expense = recent.reduce((s, p) => s + p.expense, 0);
  return { series, net: income - expense, income, expense };
}
