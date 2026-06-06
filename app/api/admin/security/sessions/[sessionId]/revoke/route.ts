import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "auth",
    path: `/auth/sessions/${encodeURIComponent(sessionId)}/revoke`,
  });
}
