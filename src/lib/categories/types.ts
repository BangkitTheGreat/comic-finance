export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  archived: boolean;
  /** Seeded from the default set; can be archived but never hard-deleted. */
  builtin: boolean;
}

export type CategoryOption = Pick<Category, "id" | "name" | "icon" | "color">;

/** Records still pointing at a category. Non-zero anywhere blocks a hard delete. */
export interface CategoryUsage {
  transactions: number;
  recurring: number;
  budgets: number;
}

export interface CategoryWithUsage extends Category {
  usage: CategoryUsage;
}

// Material Symbols names a user can pick for a custom category. A fixed
// list, like GOAL_THEMES / BILL_ICONS, so the value is validated server-side
// and never rendered from free text.
export const CATEGORY_ICONS: readonly string[] = [
  "restaurant", "local_cafe", "shopping_bag", "shopping_cart", "directions_car", "flight_takeoff",
  "home", "bolt", "wifi", "phone_iphone", "movie", "sports_esports", "fitness_center", "favorite",
  "school", "pets", "redeem", "work", "payments", "savings", "category",
];

export const CATEGORY_COLORS: readonly { value: string; label: string }[] = [
  { value: "bg-pop-pink", label: "Pink" },
  { value: "bg-pop-blue", label: "Blue" },
  { value: "bg-pop-purple", label: "Purple" },
  { value: "bg-warning", label: "Yellow" },
  { value: "bg-secondary-container", label: "Green" },
  { value: "bg-tertiary-fixed", label: "Peach" },
  { value: "bg-error-container", label: "Red" },
  { value: "bg-primary", label: "Navy" },
  { value: "bg-surface-variant", label: "Grey" },
];

export const CATEGORY_COLOR_VALUES: readonly string[] = CATEGORY_COLORS.map((c) => c.value);
