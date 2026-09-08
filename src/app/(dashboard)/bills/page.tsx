import { listBills } from "@/lib/bills/store";
import { getActiveCurrency } from "@/lib/currency/store";
import { BillsClient } from "@/components/bills/BillsClient";

export default function BillsPage() {
  const bills = listBills();
  const currency = getActiveCurrency();
  return <BillsClient bills={bills} currency={currency} />;
}
