import { listTransactions } from "@/lib/transactions/store";
import { listAccountNames } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;
  const transactions = listTransactions();
  const accounts = listAccountNames();
  const currency = getActiveCurrency();
  return <TransactionsClient transactions={transactions} accounts={accounts} initialAccount={account ?? "all"} currency={currency} />;
}
