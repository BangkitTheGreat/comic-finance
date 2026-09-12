// No framework imports here on purpose: proxy.ts (edge-capable) and
// context.ts (next/headers, server-only) both need this name without
// pulling in each other's runtime.
export const WORKSPACE_COOKIE = "workspace_id";
