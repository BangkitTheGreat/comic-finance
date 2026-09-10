import { listTransactions } from "@/lib/transactions/store";
import { listAccountNames } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; q?: string; transactionId?: string }>;
}) {
  const { account, q, transactionId } = await searchParams;
  const transactions = listTransactions();
  const accounts = listAccountNames();
  const currency = getActiveCurrency();
  return (
    <TransactionsClient
      key={`${account ?? "all"}-${q ?? ""}-${transactionId ?? ""}`}
      transactions={transactions}
      accounts={accounts}
      initialAccount={account ?? "all"}
      initialQuery={q ?? ""}
      initialTransactionId={transactionId ?? ""}
      currency={currency}
    />
  );
}
