import type { Goal } from "./types";
import { getDb, nextId } from "@/lib/db/client";

interface GoalRow {
  id: string;
  name: string;
  current: number;
  target: number;
  icon: string;
  color: string;
  bg_color: string;
}

function toGoal(row: GoalRow): Goal {
  return { id: row.id, name: row.name, current: row.current, target: row.target, icon: row.icon, color: row.color, bgColor: row.bg_color };
}

export function listGoals(workspaceId: string): Goal[] {
  const rows = getDb().prepare("SELECT * FROM goals WHERE workspace_id = ? ORDER BY id").all(workspaceId) as unknown as GoalRow[];
  return rows.map(toGoal);
}

export function getGoal(workspaceId: string, id: string): Goal | undefined {
  const row = getDb().prepare("SELECT * FROM goals WHERE workspace_id = ? AND id = ?").get(workspaceId, id) as GoalRow | undefined;
  return row ? toGoal(row) : undefined;
}

export function addGoal(workspaceId: string, data: Omit<Goal, "id">): Goal {
  const id = nextId(workspaceId, "goal", "g");
  getDb()
    .prepare("INSERT INTO goals (id, workspace_id, name, current, target, icon, color, bg_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, workspaceId, data.name, data.current, data.target, data.icon, data.color, data.bgColor);
  return { id, ...data };
}

export function updateGoal(workspaceId: string, id: string, data: Partial<Omit<Goal, "id">>): Goal | undefined {
  const existing = getGoal(workspaceId, id);
  if (!existing) return undefined;
  const updated = { ...existing, ...data };
  getDb()
    .prepare("UPDATE goals SET name = ?, current = ?, target = ?, icon = ?, color = ?, bg_color = ? WHERE workspace_id = ? AND id = ?")
    .run(updated.name, updated.current, updated.target, updated.icon, updated.color, updated.bgColor, workspaceId, id);
  return updated;
}

export function removeGoal(workspaceId: string, id: string): boolean {
  const { changes } = getDb().prepare("DELETE FROM goals WHERE workspace_id = ? AND id = ?").run(workspaceId, id);
  return Number(changes) > 0;
}

export function contributeToGoal(workspaceId: string, id: string, amount: number): Goal | undefined {
  const existing = getGoal(workspaceId, id);
  if (!existing) return undefined;
  const current = Math.max(0, existing.current + amount);
  getDb().prepare("UPDATE goals SET current = ? WHERE workspace_id = ? AND id = ?").run(current, workspaceId, id);
  return { ...existing, current };
}
