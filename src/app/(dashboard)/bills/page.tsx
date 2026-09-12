import { listBills } from "@/lib/bills/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { BillsClient } from "@/components/bills/BillsClient";
import { getWorkspaceId } from "@/lib/workspace/context";

export default async function BillsPage() {
  const workspaceId = await getWorkspaceId();
  const bills = listBills(workspaceId);
  const currency = getActiveCurrency(workspaceId);
  return <BillsClient bills={bills} currency={currency} />;
}
