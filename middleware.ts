import { NextRequest, NextResponse } from "next/server";

import { adminCookieNames } from "@/lib/admin/cookies";
import { adminSecurityHeaders } from "@/lib/admin/security-headers";

function withAdminHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(adminSecurityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Combined Auth Guard & Proxy Middleware
 *
 * Protects all /dashboard/* and /admin/* routes.
 *
 * DASHBOARD TOKEN FLOW:
 *   - Login page receives JWT from /auth/login → stores full token in
 *     localStorage (for API calls) AND sets a lightweight `auth_token`
 *     cookie (for this middleware to read server-side).
 *   - This cookie only signals "a session exists" — actual auth is
 *     validated by the backend on every API request via Bearer token.
 *   - On logout, both localStorage entry and cookie are cleared.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = Boolean(request.cookies.get(adminCookieNames.accessToken)?.value);

    if (!hasSession) {
      return withAdminHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
    }
  }

  // Dashboard route protection
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth_token")?.value;

    // No token → redirect to login, preserving the intended destination
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return withAdminHeaders(NextResponse.next());
  }

  return NextResponse.next();
}

/** Apply guard to both admin and dashboard routes */
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/dashboard", "/dashboard/:path*"],
};
