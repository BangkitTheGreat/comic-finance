export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
}

export type AccountType = "checking" | "savings" | "credit" | "debit" | "investment" | "cash";

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface AccountTypeMeta {
  type: AccountType;
  label: string;
  icon: string;
  color: string;
}

export const ACCOUNT_TYPES: AccountTypeMeta[] = [
  { type: "checking", label: "Checking", icon: "account_balance", color: "bg-secondary" },
  { type: "savings", label: "Savings", icon: "savings", color: "bg-pop-purple" },
  { type: "credit", label: "Credit Card", icon: "credit_card", color: "bg-pop-pink" },
  { type: "debit", label: "Debit Card", icon: "payments", color: "bg-pop-blue" },
  { type: "investment", label: "Investment", icon: "trending_up", color: "bg-warning" },
  { type: "cash", label: "Cash", icon: "wallet", color: "bg-tertiary-fixed" },
];

export function getAccountTypeMeta(type: AccountType): AccountTypeMeta {
  return ACCOUNT_TYPES.find((t) => t.type === type) ?? ACCOUNT_TYPES[0];
}
