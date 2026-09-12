import { listRecurring } from "@/lib/recurring/store";
import { listAccounts } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { RecurringClient } from "@/components/recurring/RecurringClient";
import { listCategories } from "@/lib/categories/store";
import { getWorkspaceId } from "@/lib/workspace/context";

export default async function RecurringPage() {
  const workspaceId = await getWorkspaceId();
  const recurring = listRecurring(workspaceId);
  const accounts = listAccounts(workspaceId);
  const categories = listCategories(workspaceId);
  const currency = getActiveCurrency(workspaceId);
  return <RecurringClient recurring={recurring} accounts={accounts} categories={categories} currency={currency} />;
}
