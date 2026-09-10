import { formatMoney, type Currency } from "@/lib/currency/types";

interface BudgetWarningBubbleProps {
  categoryName: string;
  spent: number;
  limit: number;
  /** Percentage of budget used (0–100); rounded for display. */
  percent: number;
  currency: Currency;
}

/**
 * Presentational bubble for the dashboard budget warning.
 * Pure Server Component: all values arrive as props, nothing is
 * fetched or read here. The parent decides visibility from
 * `settings.notifyBudget` and `getBudgetWarning`, so this component
 * never renders when notifications are off. All dynamic values are
 * rendered as React text (auto-escaped) — no HTML injection surface.
 */
export function BudgetWarningBubble({
  categoryName,
  spent,
  limit,
  percent,
  currency,
}: BudgetWarningBubbleProps) {
  return (
    <div className="mt-3 md:mt-0 md:absolute md:-top-12 md:-left-16 lg:-left-24 bg-surface border-2 border-border-heavy p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] z-20 max-w-[200px] transform -rotate-3 bubble-tail bubble-tail-white">
      <p className="font-bubble-text text-on-surface">
        Spending on {categoryName} is at {Math.round(percent)}% of budget!
      </p>
      <p className="font-caption text-on-surface-variant mt-1">
        {formatMoney(spent, currency)} of {formatMoney(limit, currency)}
      </p>
    </div>
  );
}
