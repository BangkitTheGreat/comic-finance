import type { Transaction } from "./types";

const seed: Transaction[] = [
  { id: "t1", merchant: "Joe's Diner", category: "Food & Dining", account: "Credit Card", date: "2026-06-11", amount: -32.5 },
  { id: "t2", merchant: "Tech Corp Inc.", category: "Salary", account: "Checking", date: "2026-06-10", amount: 4250.0 },
  { id: "t3", merchant: "City Transit", category: "Transport", account: "Debit Card", date: "2026-06-09", amount: -2.75 },
  { id: "t4", merchant: "MegaMart", category: "Groceries", account: "Credit Card", date: "2026-06-08", amount: -145.2 },
];

interface Store {
  items: Transaction[];
  counter: number;
}

const globalForStore = globalThis as unknown as { __txStore?: Store };

function getStore(): Store {
  if (!globalForStore.__txStore) {
    globalForStore.__txStore = { items: [...seed], counter: seed.length };
  }
  return globalForStore.__txStore;
}

function sortByDateDesc(items: Transaction[]): Transaction[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

export function listTransactions(): Transaction[] {
  return sortByDateDesc(getStore().items);
}

export function getTransaction(id: string): Transaction | undefined {
  return getStore().items.find((t) => t.id === id);
}

export function addTransaction(data: Omit<Transaction, "id">): Transaction {
  const store = getStore();
  store.counter += 1;
  const tx: Transaction = { ...data, id: `t${store.counter}` };
  store.items.push(tx);
  return tx;
}

export function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id">>
): Transaction | undefined {
  const store = getStore();
  const tx = store.items.find((t) => t.id === id);
  if (!tx) return undefined;
  Object.assign(tx, data);
  return tx;
}

export function removeTransaction(id: string): boolean {
  const store = getStore();
  const idx = store.items.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  store.items.splice(idx, 1);
  return true;
}
