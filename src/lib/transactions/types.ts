export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  account: string;
  date: string;
  amount: number;
  note?: string;
}

export interface CategoryMeta {
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { name: "Food & Dining", icon: "restaurant", color: "bg-pop-pink" },
  { name: "Salary", icon: "payments", color: "bg-secondary-container" },
  { name: "Transport", icon: "directions_car", color: "bg-pop-blue" },
  { name: "Groceries", icon: "shopping_bag", color: "bg-pop-purple" },
  { name: "Bills", icon: "bolt", color: "bg-tertiary-fixed" },
  { name: "Entertainment", icon: "movie", color: "bg-warning" },
  { name: "Shopping", icon: "shopping_cart", color: "bg-pop-pink" },
  { name: "Health", icon: "favorite", color: "bg-error-container" },
  { name: "Other", icon: "category", color: "bg-surface-variant" },
];

export const ACCOUNTS: string[] = [
  "Checking",
  "Savings",
  "Credit Card",
  "Debit Card",
  "Investment",
];

const DEFAULT_CATEGORY: CategoryMeta = {
  name: "Other",
  icon: "category",
  color: "bg-surface-variant",
};

export function getCategoryMeta(name: string): CategoryMeta {
  return CATEGORIES.find((c) => c.name === name) ?? DEFAULT_CATEGORY;
}
