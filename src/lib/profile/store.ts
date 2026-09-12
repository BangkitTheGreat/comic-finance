import { getDb } from "@/lib/db/client";

export interface UserProfile {
  name: string;
  email: string;
}

interface ProfileRow {
  name: string;
  email: string;
}

export function getProfile(workspaceId: string): UserProfile {
  const row = getDb().prepare("SELECT name, email FROM profiles WHERE workspace_id = ?").get(workspaceId) as ProfileRow | undefined;
  if (!row) return { name: "Penny User", email: "penny@example.com" };
  // Rebuilt as a plain object literal, never returned as-is: node:sqlite hands
  // back rows with a null prototype, and React refuses to serialize those
  // across the Server -> Client Component boundary (Sidebar/MobileNav take
  // this profile as a prop). Every other store maps its rows for the same
  // reason.
  return { name: row.name, email: row.email };
}

export function updateProfile(workspaceId: string, name: string, email: string): UserProfile {
  getDb().prepare("UPDATE profiles SET name = ?, email = ? WHERE workspace_id = ?").run(name, email, workspaceId);
  return { name, email };
}
