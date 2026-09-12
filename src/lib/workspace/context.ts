import { cookies } from "next/headers";
import { WORKSPACE_COOKIE } from "./cookie";
import { ensureWorkspace } from "./store";

export { WORKSPACE_COOKIE };

/**
 * Resolves the current visitor's workspace id from the httpOnly cookie
 * `proxy.ts` assigns on first visit. This is the ONLY source a server action
 * or page may use — never a form field, query param, or request body, which
 * a client could set to any value. It's not real authentication (a copied
 * cookie value still works, same as this app's decorative login), but it's
 * the honest ceiling of what "restrict to the owner's workspace" can mean
 * without building a real account system.
 *
 * Resolved once per request (page/layout/action), then passed down
 * explicitly as a plain argument — not re-read via an ambient/async-local
 * context — so every store call's workspace scoping stays visible and
 * testable at the call site instead of relying on framework internals to
 * propagate it correctly through React Server Component rendering.
 */
export async function getWorkspaceId(): Promise<string> {
  const store = await cookies();
  const id = store.get(WORKSPACE_COOKIE)?.value;
  if (!id) {
    throw new Error(
      "No workspace cookie on this request. proxy.ts should have assigned one before the page or action ran."
    );
  }
  // Single chokepoint: every page and action resolves its workspace id here
  // first, so this is also the one place that needs to guarantee the row
  // (and its default profile/settings/currency) exists — no other store
  // function needs its own "or create a default" fallback.
  ensureWorkspace(id);
  return id;
}
