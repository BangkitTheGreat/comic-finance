import { revalidatePath } from "next/cache";

export function revalidateFinancialPages() {
  for (const path of ["/", "/transactions", "/accounts", "/budget", "/statistics", "/recurring"]) {
    revalidatePath(path);
  }
}
