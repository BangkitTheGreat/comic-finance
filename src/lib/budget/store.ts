import type { CategoryName } from "@/lib/transactions/types";

// A budget points at a canonical category rather than copying its name and
// icon. Spending is matched on that reference, so the two can't drift apart
// and silently report zero spent. `color`/`progressColor` stay here because
// they are budget-card styling, not category identity.
export interface BudgetCategory {
  id: string;
  category: CategoryName;
  budget: number;
  color: string;
  progressColor: string;
}

const seed: BudgetCategory[] = [
  { id: "bc1", category: "Food & Dining", budget: 600, color: "bg-tertiary-fixed", progressColor: "bg-warning" },
  { id: "bc2", category: "Bills", budget: 500, color: "bg-secondary-container", progressColor: "bg-primary" },
  { id: "bc3", category: "Entertainment", budget: 300, color: "bg-pop-purple", progressColor: "bg-secondary" },
  { id: "bc4", category: "Groceries", budget: 400, color: "bg-pop-purple", progressColor: "bg-pop-pink" },
  { id: "bc5", category: "Transport", budget: 200, color: "bg-pop-blue", progressColor: "bg-pop-blue" },
];

interface Store {
  items: BudgetCategory[];
}

const globalForStore = globalThis as unknown as { __budgetStore?: Store };

function getStore(): Store {
  if (!globalForStore.__budgetStore) {
    globalForStore.__budgetStore = { items: seed.map((c) => ({ ...c })) };
  }
  return globalForStore.__budgetStore;
}

export function listBudgetCategories(): BudgetCategory[] {
  return getStore().items;
}

export function getBudgetCategory(id: string): BudgetCategory | undefined {
  return getStore().items.find((c) => c.id === id);
}

export function updateBudgetLimit(id: string, budget: number): BudgetCategory | undefined {
  const store = getStore();
  const idx = store.items.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const updated = { ...store.items[idx], budget };
  store.items[idx] = updated;
  return updated;
}
