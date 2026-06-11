import { NextRequest, NextResponse } from "next/server";

import { adminCookieNames } from "@/lib/admin/cookies";
import { adminSecurityHeaders } from "@/lib/admin/security-headers";
import { userCookieNames } from "@/lib/auth/cookies";

function withAdminHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(adminSecurityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

const USER_PROTECTED_PREFIXES = ["/dashboard", "/account", "/trades", "/trader"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route guard
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = Boolean(request.cookies.get(adminCookieNames.accessToken)?.value);

    if (!hasSession) {
      return withAdminHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
    }
  }

  // End-user route guard
  if (USER_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const hasSession = Boolean(request.cookies.get(userCookieNames.accessToken)?.value);

    if (!hasSession) {
      const next = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
    }
  }

  return withAdminHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/trades/:path*",
    "/trader/:path*",
  ],
};
