import type { CurrencyCode } from "./types";
import { getCurrencyByCode, type Currency } from "./types";
import { getDb } from "@/lib/db/client";

export function getCurrencyCode(workspaceId: string): CurrencyCode {
  const row = getDb().prepare("SELECT code FROM currency WHERE workspace_id = ?").get(workspaceId) as { code: CurrencyCode } | undefined;
  return row?.code ?? "USD";
}

export function getActiveCurrency(workspaceId: string): Currency {
  return getCurrencyByCode(getCurrencyCode(workspaceId));
}

export function setCurrencyCode(workspaceId: string, code: CurrencyCode): void {
  getDb().prepare("UPDATE currency SET code = ? WHERE workspace_id = ?").run(code, workspaceId);
}
