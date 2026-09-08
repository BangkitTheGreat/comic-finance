import { listRecurring } from "@/lib/recurring/store";
import { listAccountNames } from "@/lib/accounts/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { RecurringClient } from "@/components/recurring/RecurringClient";

export default function RecurringPage() {
  const recurring = listRecurring();
  const accounts = listAccountNames();
  const currency = getActiveCurrency();
  return <RecurringClient recurring={recurring} accounts={accounts} currency={currency} />;
}
