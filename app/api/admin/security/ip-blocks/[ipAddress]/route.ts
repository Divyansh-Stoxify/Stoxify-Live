import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ ipAddress: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { ipAddress } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "auth",
    path: `/auth/ip-blocks/${encodeURIComponent(ipAddress)}`,
  });
}
