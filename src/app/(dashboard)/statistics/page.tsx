import { getStatsForRange } from "@/lib/transactions/analytics";
import { getActiveCurrency } from "@/lib/currency/store";
import { StatisticsClient } from "@/components/statistics/StatisticsClient";
import { getWorkspaceId } from "@/lib/workspace/context";

export default async function StatisticsPage() {
  const workspaceId = await getWorkspaceId();
  const ranges = {
    month: getStatsForRange(workspaceId, "month"),
    quarter: getStatsForRange(workspaceId, "quarter"),
    year: getStatsForRange(workspaceId, "year"),
  };
  const currency = getActiveCurrency(workspaceId);
  return <StatisticsClient ranges={ranges} currency={currency} />;
}
