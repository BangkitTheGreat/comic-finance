import { getAccountsWithBalances } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { AccountsClient } from "@/components/accounts/AccountsClient";
import { getWorkspaceId } from "@/lib/workspace/context";

export default async function AccountsPage() {
  const workspaceId = await getWorkspaceId();
  const accounts = getAccountsWithBalances(workspaceId);
  const currency = getActiveCurrency(workspaceId);
  return <AccountsClient accounts={accounts} currency={currency} />;
}
