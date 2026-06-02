import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ tradeId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { tradeId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "trade",
    path: `/trades/${encodeURIComponent(tradeId)}`,
  });
}
