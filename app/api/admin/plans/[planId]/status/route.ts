import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ planId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { planId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "plan",
    path: `/plans/${encodeURIComponent(planId)}/status`,
  });
}
