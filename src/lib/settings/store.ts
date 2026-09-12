import type { Settings, SettingKey } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { getDb } from "@/lib/db/client";

interface SettingsRow {
  notify_bills: number;
  notify_budget: number;
  reduce_motion: number;
}

function toSettings(row: SettingsRow): Settings {
  return { notifyBills: Boolean(row.notify_bills), notifyBudget: Boolean(row.notify_budget), reduceMotion: Boolean(row.reduce_motion) };
}

export function getSettings(workspaceId: string): Settings {
  const row = getDb().prepare("SELECT notify_bills, notify_budget, reduce_motion FROM settings WHERE workspace_id = ?").get(workspaceId) as
    | SettingsRow
    | undefined;
  return row ? toSettings(row) : { ...DEFAULT_SETTINGS };
}

export function setSetting(workspaceId: string, key: SettingKey, value: boolean): Settings {
  const column = { notifyBills: "notify_bills", notifyBudget: "notify_budget", reduceMotion: "reduce_motion" }[key];
  getDb().prepare(`UPDATE settings SET ${column} = ? WHERE workspace_id = ?`).run(Number(value), workspaceId);
  return getSettings(workspaceId);
}
