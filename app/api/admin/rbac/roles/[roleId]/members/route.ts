import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ roleId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { roleId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "rbac",
    path: `/rbac/roles/${encodeURIComponent(roleId)}/members`,
  });
}
