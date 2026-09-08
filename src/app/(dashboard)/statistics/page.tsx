import { getStatsForRange } from "@/lib/transactions/analytics";
import { getActiveCurrency } from "@/lib/currency/store";
import { StatisticsClient } from "@/components/statistics/StatisticsClient";

export default function StatisticsPage() {
  const ranges = {
    month: getStatsForRange("month"),
    quarter: getStatsForRange("quarter"),
    year: getStatsForRange("year"),
  };
  const currency = getActiveCurrency();
  return <StatisticsClient ranges={ranges} currency={currency} />;
}
