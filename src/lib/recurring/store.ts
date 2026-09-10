import type { Recurring } from "./types";
import { advanceDate, isDue } from "./types";
import { addTransaction } from "@/lib/transactions/store";
import { getAccount } from "@/lib/accounts/store";
import { isPositiveAmount, isValidIsoDate } from "@/lib/validation";
import { CATEGORIES } from "@/lib/transactions/types";
import { FREQUENCIES } from "./types";
import { isoOffsetDays as isoOffset } from "@/lib/dates";

const seed: Recurring[] = [
  { id: "r1", merchant: "Netflix", category: "Entertainment", accountId: "a1", type: "expense", amount: 15.99, frequency: "monthly", nextDue: isoOffset(6), active: true },
  { id: "r2", merchant: "Tech Corp Inc.", category: "Salary", accountId: "a1", type: "income", amount: 4250, frequency: "monthly", nextDue: isoOffset(19), active: true },
  { id: "r3", merchant: "Gym Membership", category: "Health", accountId: "a1", type: "expense", amount: 29.99, frequency: "monthly", nextDue: isoOffset(2), active: true },
];

interface Store {
  items: Recurring[];
  counter: number;
}

const globalForStore = globalThis as unknown as { __recurringStore?: Store };

function getStore(): Store {
  if (!globalForStore.__recurringStore) {
    globalForStore.__recurringStore = { items: seed.map((r) => ({ ...r })), counter: seed.length };
  }
  return globalForStore.__recurringStore;
}

export function listRecurring(): Recurring[] {
  return [...getStore().items].sort((a, b) => a.nextDue.localeCompare(b.nextDue));
}

export function recurringCountsByAccount(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const rec of getStore().items) counts.set(rec.accountId, (counts.get(rec.accountId) ?? 0) + 1);
  return counts;
}

/** Repoints every recurring rule on `fromId` at `toId`. Returns how many moved. */
export function reassignRecurring(fromId: string, toId: string): number {
  const store = getStore();
  let moved = 0;
  store.items = store.items.map((rec) => {
    if (rec.accountId !== fromId) return rec;
    moved += 1;
    return { ...rec, accountId: toId };
  });
  return moved;
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
  const idx = store.items.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  const updated = { ...store.items[idx], ...data };
  store.items[idx] = updated;
  return updated;
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
    if (!rec.active || !getAccount(rec.accountId) || !isPositiveAmount(rec.amount) ||
      !isValidIsoDate(rec.nextDue) || !["income", "expense"].includes(rec.type) ||
      !FREQUENCIES.some(f => f.value === rec.frequency) || !CATEGORIES.some(c => c.name === rec.category)) continue;
    let guard = 0;
    while (isDue(rec.nextDue) && guard < 60) {
      addTransaction({
        merchant: rec.merchant,
        category: rec.category,
        accountId: rec.accountId,
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
