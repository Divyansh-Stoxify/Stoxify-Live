import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ powerId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { powerId } = await context.params;
  return proxyAdminRequest({ request, backend: "rbac", path: `/rbac/powers/${encodeURIComponent(powerId)}` });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { powerId } = await context.params;
  return proxyAdminRequest({ request, backend: "rbac", path: `/rbac/powers/${encodeURIComponent(powerId)}` });
}
