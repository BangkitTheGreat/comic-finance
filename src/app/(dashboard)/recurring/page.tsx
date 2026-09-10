import { listRecurring } from "@/lib/recurring/store";
import { listAccounts } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { RecurringClient } from "@/components/recurring/RecurringClient";

export default function RecurringPage() {
  const recurring = listRecurring();
  const accounts = listAccounts();
  const currency = getActiveCurrency();
  return <RecurringClient recurring={recurring} accounts={accounts} currency={currency} />;
}
