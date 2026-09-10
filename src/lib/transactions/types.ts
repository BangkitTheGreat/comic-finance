export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  merchant: string;
  category: CategoryName;
  accountId: string;
  date: string;
  amount: number;
  note?: string;
}

export interface CategoryMeta {
  readonly name: string;
  readonly icon: string;
  readonly color: string;
}

// The single source of truth for categories. `as const` makes the names a
// literal union (CategoryName), so anything referencing a category — a
// transaction, a recurring rule, a budget — fails to compile on a typo
// instead of silently matching nothing at runtime.
export const CATEGORIES = [
  { name: "Food & Dining", icon: "restaurant", color: "bg-pop-pink" },
  { name: "Salary", icon: "payments", color: "bg-secondary-container" },
  { name: "Transport", icon: "directions_car", color: "bg-pop-blue" },
  { name: "Groceries", icon: "shopping_bag", color: "bg-pop-purple" },
  { name: "Bills", icon: "bolt", color: "bg-tertiary-fixed" },
  { name: "Entertainment", icon: "movie", color: "bg-warning" },
  { name: "Shopping", icon: "shopping_cart", color: "bg-pop-pink" },
  { name: "Health", icon: "favorite", color: "bg-error-container" },
  { name: "Other", icon: "category", color: "bg-surface-variant" },
] as const satisfies readonly CategoryMeta[];

export type CategoryName = (typeof CATEGORIES)[number]["name"];

export const CATEGORY_NAMES: readonly CategoryName[] = CATEGORIES.map((c) => c.name);

const DEFAULT_CATEGORY: CategoryMeta = {
  name: "Other",
  icon: "category",
  color: "bg-surface-variant",
};

export function getCategoryMeta(name: string): CategoryMeta {
  return CATEGORIES.find((c) => c.name === name) ?? DEFAULT_CATEGORY;
}
