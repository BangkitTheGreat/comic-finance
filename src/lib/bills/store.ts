import type { Bill } from "./types";
import { getDb, nextId } from "@/lib/db/client";

interface BillRow {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  icon: string;
  paid: number;
}

function toBill(row: BillRow): Bill {
  return { id: row.id, name: row.name, amount: row.amount, dueDate: row.due_date, icon: row.icon, paid: Boolean(row.paid) };
}

export function listBills(workspaceId: string): Bill[] {
  const rows = getDb()
    .prepare("SELECT * FROM bills WHERE workspace_id = ? ORDER BY due_date")
    .all(workspaceId) as unknown as BillRow[];
  return rows.map(toBill);
}

export function getBill(workspaceId: string, id: string): Bill | undefined {
  const row = getDb().prepare("SELECT * FROM bills WHERE workspace_id = ? AND id = ?").get(workspaceId, id) as BillRow | undefined;
  return row ? toBill(row) : undefined;
}

export function addBill(workspaceId: string, data: Omit<Bill, "id">): Bill {
  const id = nextId(workspaceId, "bill", "b");
  getDb()
    .prepare("INSERT INTO bills (id, workspace_id, name, amount, due_date, icon, paid) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, workspaceId, data.name, data.amount, data.dueDate, data.icon, Number(data.paid));
  return { id, ...data };
}

export function updateBill(workspaceId: string, id: string, data: Partial<Omit<Bill, "id">>): Bill | undefined {
  const existing = getBill(workspaceId, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...data };
  getDb()
    .prepare("UPDATE bills SET name = ?, amount = ?, due_date = ?, icon = ?, paid = ? WHERE workspace_id = ? AND id = ?")
    .run(updated.name, updated.amount, updated.dueDate, updated.icon, Number(updated.paid), workspaceId, id);
  return updated;
}

export function removeBill(workspaceId: string, id: string): boolean {
  const { changes } = getDb().prepare("DELETE FROM bills WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
  return Number(changes) > 0;
}

export function setBillPaid(workspaceId: string, id: string, paid: boolean): Bill | undefined {
  return updateBill(workspaceId, id, { paid });
}
