import { getAccountsWithBalances } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { AccountsClient } from "@/components/accounts/AccountsClient";

export default function AccountsPage() {
  const accounts = getAccountsWithBalances();
  const currency = getActiveCurrency();
  return <AccountsClient accounts={accounts} currency={currency} />;
}
