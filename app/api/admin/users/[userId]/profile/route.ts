import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/users/${encodeURIComponent(userId)}/profile`,
  });
}
