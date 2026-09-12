import { listTransactions } from "@/lib/transactions/store";
import { listAccounts } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";
import { listCategories } from "@/lib/categories/store";
import { getWorkspaceId } from "@/lib/workspace/context";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  const { accountId } = await searchParams;
  const workspaceId = await getWorkspaceId();
  const transactions = listTransactions(workspaceId);
  const accounts = listAccounts(workspaceId);
  const categories = listCategories(workspaceId);
  const currency = getActiveCurrency(workspaceId);
  return <TransactionsClient key={accountId ?? "all"} transactions={transactions} accounts={accounts} categories={categories} initialAccountId={accountId ?? "all"} currency={currency} />;
}
