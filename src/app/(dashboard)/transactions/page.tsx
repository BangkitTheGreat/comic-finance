import { listTransactions } from "@/lib/transactions/store";
import { listAccounts } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  const { accountId } = await searchParams;
  const transactions = listTransactions();
  const accounts = listAccounts();
  const currency = getActiveCurrency();
  return <TransactionsClient key={accountId ?? "all"} transactions={transactions} accounts={accounts} initialAccountId={accountId ?? "all"} currency={currency} />;
}
