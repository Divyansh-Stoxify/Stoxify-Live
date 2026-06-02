import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ roleId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { roleId } = await context.params;
  return proxyAdminRequest({ request, backend: "rbac", path: `/rbac/roles/${encodeURIComponent(roleId)}` });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { roleId } = await context.params;
  return proxyAdminRequest({ request, backend: "rbac", path: `/rbac/roles/${encodeURIComponent(roleId)}` });
}
