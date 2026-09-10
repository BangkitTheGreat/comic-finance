import type { Account, AccountWithBalance } from "./types";
import { transactionTotalsByAccount, transactionCountsByAccount, hasTransactionsForAccount } from "@/lib/transactions/store";
import { listRecurring, recurringCountsByAccount } from "@/lib/recurring/store";
import { ValidationError } from "@/lib/action-result";

const seed: Account[] = [
  { id: "a1", name: "Main Checking", type: "checking", initialBalance: 7782.0, color: "bg-secondary" },
  { id: "a2", name: "Emergency Savings", type: "savings", initialBalance: 10000.0, color: "bg-pop-purple" },
  { id: "a3", name: "Stock Portfolio", type: "investment", initialBalance: 2592.8, color: "bg-warning" },
];

interface Store {
  items: Account[];
  counter: number;
}

const globalForStore = globalThis as unknown as { __accountStore?: Store };

function getStore(): Store {
  if (!globalForStore.__accountStore) {
    globalForStore.__accountStore = { items: seed.map((a) => ({ ...a })), counter: seed.length };
  }
  return globalForStore.__accountStore;
}

export function listAccounts(): Account[] {
  return getStore().items;
}

export function getAccount(id: string): Account | undefined {
  return getStore().items.find((a) => a.id === id);
}

export function addAccount(data: Omit<Account, "id">): Account {
  const store = getStore();
  store.counter += 1;
  const account: Account = { ...data, id: `a${store.counter}` };
  store.items.push(account);
  return account;
}

export function updateAccount(id: string, data: Partial<Omit<Account, "id">>): Account | undefined {
  const store = getStore();
  const idx = store.items.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  const updated = { ...store.items[idx], ...data };
  store.items[idx] = updated;
  return updated;
}

export function removeAccount(id: string): boolean {
  const store = getStore();
  const idx = store.items.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  if (hasTransactionsForAccount(id) || listRecurring().some(r => r.accountId === id)) {
    throw new ValidationError("This account is used by transactions or recurring rules. Move those records to another account before deleting it.");
  }
  store.items.splice(idx, 1);
  return true;
}

export function getAccountsWithBalances(): AccountWithBalance[] {
  const txByAccount = transactionTotalsByAccount();
  const txCounts = transactionCountsByAccount();
  const recCounts = recurringCountsByAccount();
  return getStore().items.map((a) => ({
    ...a,
    balance: a.initialBalance + (txByAccount.get(a.id) ?? 0),
    transactionCount: txCounts.get(a.id) ?? 0,
    recurringCount: recCounts.get(a.id) ?? 0,
  }));
}
