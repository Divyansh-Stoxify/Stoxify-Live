import { NextRequest, NextResponse } from "next/server";

import { adminCookieNames } from "@/lib/admin/cookies";
import { adminSecurityHeaders } from "@/lib/admin/security-headers";

function withAdminHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(adminSecurityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = Boolean(request.cookies.get(adminCookieNames.accessToken)?.value);

    if (!hasSession) {
      return withAdminHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
    }
  }

  return withAdminHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
