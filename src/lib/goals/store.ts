import type { Goal } from "./types";

const seed: Goal[] = [
  { id: "g1", name: "Japan Trip", current: 3000, target: 5000, icon: "flight_takeoff", color: "text-primary", bgColor: "bg-primary" },
  { id: "g2", name: "New Car Downpayment", current: 8000, target: 10000, icon: "directions_car", color: "text-pop-purple", bgColor: "bg-pop-purple" },
];

interface Store {
  items: Goal[];
  counter: number;
}

const globalForStore = globalThis as unknown as { __goalStore?: Store };

function getStore(): Store {
  if (!globalForStore.__goalStore) {
    globalForStore.__goalStore = { items: seed.map(item => ({ ...item })), counter: seed.length };
  }
  return globalForStore.__goalStore;
}

export function listGoals(): Goal[] {
  return getStore().items;
}

export function getGoal(id: string): Goal | undefined {
  return getStore().items.find((g) => g.id === id);
}

export function addGoal(data: Omit<Goal, "id">): Goal {
  const store = getStore();
  store.counter += 1;
  const goal: Goal = { ...data, id: `g${store.counter}` };
  store.items.push(goal);
  return goal;
}

export function updateGoal(id: string, data: Partial<Omit<Goal, "id">>): Goal | undefined {
  const store = getStore();
  const goal = store.items.find((g) => g.id === id);
  if (!goal) return undefined;
  Object.assign(goal, data);
  return goal;
}

export function removeGoal(id: string): boolean {
  const store = getStore();
  const idx = store.items.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  store.items.splice(idx, 1);
  return true;
}

export function contributeToGoal(id: string, amount: number): Goal | undefined {
  const store = getStore();
  const goal = store.items.find((g) => g.id === id);
  if (!goal) return undefined;
  goal.current = Math.max(0, goal.current + amount);
  return goal;
}
