import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ symbol: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { symbol } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "marketData",
    path: `/market-data/instruments/${encodeURIComponent(symbol)}`,
  });
}
