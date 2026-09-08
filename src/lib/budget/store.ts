export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  icon: string;
  color: string;
  progressColor: string;
}

const seed: BudgetCategory[] = [
  { id: "bc1", name: "Food & Dining", budget: 600, icon: "restaurant", color: "bg-tertiary-fixed", progressColor: "bg-warning" },
  { id: "bc2", name: "Bills", budget: 500, icon: "bolt", color: "bg-secondary-container", progressColor: "bg-primary" },
  { id: "bc3", name: "Entertainment", budget: 300, icon: "movie", color: "bg-pop-purple", progressColor: "bg-secondary" },
  { id: "bc4", name: "Groceries", budget: 400, icon: "shopping_bag", color: "bg-pop-purple", progressColor: "bg-pop-pink" },
  { id: "bc5", name: "Transport", budget: 200, icon: "directions_car", color: "bg-pop-blue", progressColor: "bg-pop-blue" },
];

interface Store {
  items: BudgetCategory[];
}

const globalForStore = globalThis as unknown as { __budgetStore?: Store };

function getStore(): Store {
  if (!globalForStore.__budgetStore) {
    globalForStore.__budgetStore = { items: [...seed] };
  }
  return globalForStore.__budgetStore;
}

export function listBudgetCategories(): BudgetCategory[] {
  return getStore().items;
}

export function updateBudgetLimit(id: string, budget: number): BudgetCategory | undefined {
  const cat = getStore().items.find((c) => c.id === id);
  if (!cat) return undefined;
  cat.budget = budget;
  return cat;
}
