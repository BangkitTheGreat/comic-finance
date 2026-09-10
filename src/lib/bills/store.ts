import type { Bill } from "./types";
import { isoOffsetDays as isoOffset } from "@/lib/dates";

const seed: Bill[] = [
  { id: "b1", name: "Internet", amount: 79.99, dueDate: isoOffset(2), icon: "wifi", paid: false },
  { id: "b2", name: "Electricity", amount: 124.5, dueDate: isoOffset(5), icon: "bolt", paid: false },
  { id: "b3", name: "Water", amount: 45.0, dueDate: isoOffset(-1), icon: "water_drop", paid: false },
];

interface Store {
  items: Bill[];
  counter: number;
}

const globalForStore = globalThis as unknown as { __billStore?: Store };

function getStore(): Store {
  if (!globalForStore.__billStore) {
    globalForStore.__billStore = { items: [...seed], counter: seed.length };
  }
  return globalForStore.__billStore;
}

export function listBills(): Bill[] {
  return [...getStore().items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getBill(id: string): Bill | undefined {
  return getStore().items.find((b) => b.id === id);
}

export function addBill(data: Omit<Bill, "id">): Bill {
  const store = getStore();
  store.counter += 1;
  const bill: Bill = { ...data, id: `b${store.counter}` };
  store.items.push(bill);
  return bill;
}

export function updateBill(id: string, data: Partial<Omit<Bill, "id">>): Bill | undefined {
  const store = getStore();
  const bill = store.items.find((b) => b.id === id);
  if (!bill) return undefined;
  Object.assign(bill, data);
  return bill;
}

export function removeBill(id: string): boolean {
  const store = getStore();
  const idx = store.items.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  store.items.splice(idx, 1);
  return true;
}

export function setBillPaid(id: string, paid: boolean): Bill | undefined {
  return updateBill(id, { paid });
}
