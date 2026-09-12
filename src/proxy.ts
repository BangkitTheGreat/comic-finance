import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { WORKSPACE_COOKIE } from "@/lib/workspace/cookie";

// Next.js 16 renamed Middleware to Proxy (same mechanism, new file name/
// convention) — see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
//
// This is the only place a workspace id is ever minted. Every page and
// server action downstream only ever *reads* this cookie (never a form
// field or query param) — see src/lib/workspace/context.ts. Without a real
// login this is the honest ceiling of "workspace ownership": a per-browser
// anonymous id, not a verified identity. A copied cookie value still works,
// same as this app's decorative login page.
export function proxy(request: NextRequest) {
  if (request.cookies.get(WORKSPACE_COOKIE)?.value) return NextResponse.next();

  const response = NextResponse.next();
  response.cookies.set(WORKSPACE_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
