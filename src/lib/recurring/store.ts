import type { Recurring } from "./types";
import { advanceDate, isDue } from "./types";
import { addTransaction } from "@/lib/transactions/store";

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const seed: Recurring[] = [
  { id: "r1", merchant: "Netflix", category: "Entertainment", account: "Credit Card", type: "expense", amount: 15.99, frequency: "monthly", nextDue: isoOffset(6), active: true },
  { id: "r2", merchant: "Tech Corp Inc.", category: "Salary", account: "Checking", type: "income", amount: 4250, frequency: "monthly", nextDue: isoOffset(19), active: true },
  { id: "r3", merchant: "Gym Membership", category: "Health", account: "Debit Card", type: "expense", amount: 29.99, frequency: "monthly", nextDue: isoOffset(2), active: true },
];

interface Store {
  items: Recurring[];
  counter: number;
}

const globalForStore = globalThis as unknown as { __recurringStore?: Store };

function getStore(): Store {
  if (!globalForStore.__recurringStore) {
    globalForStore.__recurringStore = { items: [...seed], counter: seed.length };
  }
  return globalForStore.__recurringStore;
}

export function listRecurring(): Recurring[] {
  return [...getStore().items].sort((a, b) => a.nextDue.localeCompare(b.nextDue));
}

export function getRecurring(id: string): Recurring | undefined {
  return getStore().items.find((r) => r.id === id);
}

export function addRecurring(data: Omit<Recurring, "id">): Recurring {
  const store = getStore();
  store.counter += 1;
  const rec: Recurring = { ...data, id: `r${store.counter}` };
  store.items.push(rec);
  return rec;
}

export function updateRecurring(id: string, data: Partial<Omit<Recurring, "id">>): Recurring | undefined {
  const store = getStore();
  const rec = store.items.find((r) => r.id === id);
  if (!rec) return undefined;
  Object.assign(rec, data);
  return rec;
}

export function removeRecurring(id: string): boolean {
  const store = getStore();
  const idx = store.items.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  store.items.splice(idx, 1);
  return true;
}

export function processDueRecurring(): number {
  const store = getStore();
  let posted = 0;
  for (const rec of store.items) {
    if (!rec.active) continue;
    let guard = 0;
    while (isDue(rec.nextDue) && guard < 60) {
      addTransaction({
        merchant: rec.merchant,
        category: rec.category,
        account: rec.account,
        date: rec.nextDue,
        amount: rec.type === "income" ? Math.abs(rec.amount) : -Math.abs(rec.amount),
        note: "Recurring",
      });
      rec.nextDue = advanceDate(rec.nextDue, rec.frequency);
      posted += 1;
      guard += 1;
    }
  }
  return posted;
}
