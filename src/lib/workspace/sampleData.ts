import { addAccount } from "@/lib/accounts/store";
import { addTransaction } from "@/lib/transactions/store";
import { addRecurring } from "@/lib/recurring/store";
import { addBudget } from "@/lib/budget/store";
import { getCategoryByName } from "@/lib/categories/store";

const categoryId = (workspaceId: string, name: string) => getCategoryByName(workspaceId, name)!.id;
import { addGoal } from "@/lib/goals/store";
import { addBill } from "@/lib/bills/store";
import { currentMonth, isoOffsetDays } from "@/lib/dates";

/**
 * The sample dataset "Load sample data" fills an empty workspace with.
 * Same shape as the old hardcoded `seed` arrays each store used to carry,
 * just inserted through the normal store API (so ids come from the same
 * per-workspace counter real records use) instead of being auto-loaded on
 * first access. Dates are relative to today rather than fixed calendar
 * dates, so the sample still looks current whenever someone loads it.
 */
export function loadSampleDataInto(workspaceId: string): void {
  const checking = addAccount(workspaceId, { name: "Main Checking", type: "checking", initialBalance: 7782.0, color: "bg-secondary" });
  addAccount(workspaceId, { name: "Emergency Savings", type: "savings", initialBalance: 10000.0, color: "bg-pop-purple" });
  addAccount(workspaceId, { name: "Stock Portfolio", type: "investment", initialBalance: 2592.8, color: "bg-warning" });

  addTransaction(workspaceId, { merchant: "Joe's Diner", categoryId: categoryId(workspaceId, "Food & Dining"), accountId: checking.id, date: isoOffsetDays(-2), amount: -32.5 });
  addTransaction(workspaceId, { merchant: "Tech Corp Inc.", categoryId: categoryId(workspaceId, "Salary"), accountId: checking.id, date: isoOffsetDays(-3), amount: 4250.0 });
  addTransaction(workspaceId, { merchant: "City Transit", categoryId: categoryId(workspaceId, "Transport"), accountId: checking.id, date: isoOffsetDays(-4), amount: -2.75 });
  addTransaction(workspaceId, { merchant: "MegaMart", categoryId: categoryId(workspaceId, "Groceries"), accountId: checking.id, date: isoOffsetDays(-5), amount: -145.2 });

  addRecurring(workspaceId, { merchant: "Netflix", categoryId: categoryId(workspaceId, "Entertainment"), accountId: checking.id, type: "expense", amount: 15.99, frequency: "monthly", nextDue: isoOffsetDays(6), active: true });
  addRecurring(workspaceId, { merchant: "Tech Corp Inc.", categoryId: categoryId(workspaceId, "Salary"), accountId: checking.id, type: "income", amount: 4250, frequency: "monthly", nextDue: isoOffsetDays(19), active: true });
  addRecurring(workspaceId, { merchant: "Gym Membership", categoryId: categoryId(workspaceId, "Health"), accountId: checking.id, type: "expense", amount: 29.99, frequency: "monthly", nextDue: isoOffsetDays(2), active: true });

  const month = currentMonth();
  for (const [name, limit] of [["Food & Dining", 600], ["Bills", 500], ["Entertainment", 300], ["Groceries", 400], ["Transport", 200]] as const) {
    addBudget(workspaceId, { categoryId: categoryId(workspaceId, name), month, limit, status: "active" });
  }

  addGoal(workspaceId, { name: "Japan Trip", current: 3000, target: 5000, icon: "flight_takeoff", color: "text-primary", bgColor: "bg-primary" });
  addGoal(workspaceId, { name: "New Car Downpayment", current: 8000, target: 10000, icon: "directions_car", color: "text-pop-purple", bgColor: "bg-pop-purple" });

  addBill(workspaceId, { name: "Internet", amount: 79.99, dueDate: isoOffsetDays(2), icon: "wifi", paid: false });
  addBill(workspaceId, { name: "Electricity", amount: 124.5, dueDate: isoOffsetDays(5), icon: "bolt", paid: false });
  addBill(workspaceId, { name: "Water", amount: 45.0, dueDate: isoOffsetDays(-1), icon: "water_drop", paid: false });
}
