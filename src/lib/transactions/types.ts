export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  merchant: string;
  /** References a row in the workspace's `categories` table, never a name. */
  categoryId: string;
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

// The default categories every new workspace is seeded with. Since Part 4
// these are only the *starting set*: the live list lives in the `categories`
// table per workspace, and transactions, recurring rules and budgets all
// point at a category id. Kept here so seeding and the migration share one
// definition of the defaults.
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
