"use client";

import { useMemo, useState } from "react";
import { ComicCard } from "@/components/ui/ComicCard";
import type { RangeStats, StatsRange } from "@/lib/transactions/analytics";
import { formatMoneyAbs, type Currency } from "@/lib/currency/types";

interface Props {
  ranges: Record<StatsRange, RangeStats>;
  currency: Currency;
}

const RANGE_LABELS: { value: StatsRange; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

export function StatisticsClient({ ranges, currency }: Props) {
  const [range, setRange] = useState<StatsRange>("quarter");
  const stats = ranges[range];
  const maxVal = useMemo(
    () => Math.max(1, ...stats.series.flatMap((p) => [p.income, p.expense])),
    [stats]
  );
  const rangeWord = range === "month" ? "this month" : range === "quarter" ? "this quarter" : "this year";

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg font-bold text-ink">Statistics &amp; Insights</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Your money&apos;s story, told simply.</p>
        </div>
        <div className="flex bg-surface rounded-xl border-2 border-border-heavy p-1 shadow-comic">
          {RANGE_LABELS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 rounded-lg font-label-md transition-colors ${
                range === r.value
                  ? "bg-primary text-on-primary border-2 border-border-heavy shadow-[2px_2px_0px_0px_#111827] -translate-y-[2px] -translate-x-[2px]"
                  : "text-on-surface hover:bg-surface-variant"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ComicCard className="flex flex-col justify-between relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-headline-md text-ink">Net Cashflow</h2>
            <div className="w-10 h-10 rounded-full bg-secondary-container border-2 border-border-heavy flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-container">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total Saved</p>
            <p className="font-display-numeric text-primary">{stats.net < 0 ? "-" : ""}{formatMoneyAbs(stats.net, currency)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-secondary text-sm bg-secondary-container rounded-full p-1 border border-border-heavy">{stats.net >= 0 ? "arrow_upward" : "arrow_downward"}</span>
              <span className="font-label-md text-secondary">{stats.net >= 0 ? "Net positive" : "Net negative"} {rangeWord}</span>
            </div>
          </div>

          <div className="absolute -top-6 -right-4 md:-right-8 bg-warning border-[3px] border-border-heavy p-3 rounded-2xl rounded-bl-none shadow-comic-heavy z-10 max-w-[200px] transform rotate-2">
            <p className="font-bubble-text text-ink leading-tight">
              {stats.net >= 0 ? "You're in the green! Keep stacking those coins! 🚀" : "Spending outpaced income. Time to trim! ✂️"}
            </p>
            <div className="absolute -bottom-[12px] left-6 border-solid border-t-border-heavy border-t-[12px] border-x-transparent border-x-[12px] border-b-0 w-0 h-0"></div>
            <div className="absolute -bottom-[8px] left-[26px] border-solid border-t-warning border-t-[8px] border-x-transparent border-x-[8px] border-b-0 w-0 h-0 z-10"></div>
          </div>
        </ComicCard>

        <ComicCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-ink">Income vs Expense</h2>
            <span className="material-symbols-outlined text-outline">bar_chart</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 mt-4 px-2">
            {stats.series.map((point, i) => (
              <div key={point.month} className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-end gap-1 w-full h-32 justify-center">
                  <div className="w-1/3 bg-secondary border-2 border-border-heavy rounded-t-sm shadow-comic hover:-translate-y-1 transition-transform" style={{height: `${Math.max((point.income / maxVal) * 100, 2)}%`}}></div>
                  <div className="w-1/3 bg-danger border-2 border-border-heavy rounded-t-sm shadow-comic hover:-translate-y-1 transition-transform" style={{height: `${Math.max((point.expense / maxVal) * 100, 2)}%`}}></div>
                </div>
                <span className={`font-caption ${i === stats.series.length - 1 ? 'text-ink font-bold' : 'text-on-surface-variant'}`}>{point.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-6 border-t-2 border-border-heavy pt-4 border-dashed">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-secondary border-2 border-border-heavy rounded-sm"></div>
              <span className="font-label-md">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-danger border-2 border-border-heavy rounded-sm"></div>
              <span className="font-label-md">Expense</span>
            </div>
          </div>
        </ComicCard>
      </div>
    </>
  );
}
