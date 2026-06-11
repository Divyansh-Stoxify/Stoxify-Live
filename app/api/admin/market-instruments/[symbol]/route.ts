import { NextRequest } from "next/server";

import { proxyAdminInternalRequest } from "@/lib/admin/internal-proxy";

type RouteContext = { params: Promise<{ symbol: string }> };

// DELETE is interServiceAuth-only on the backend
// (/market-data/internal/instruments/:symbol). Gate on PWR_MARKET_DATA_MANAGE
// in the BFF and inject the internal secret.
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { symbol } = await context.params;
  return proxyAdminInternalRequest({
    request,
    backend: "marketData",
    path: `/market-data/internal/instruments/${encodeURIComponent(symbol)}`,
    method: "DELETE",
    requiredPower: "PWR_MARKET_DATA_MANAGE",
  });
}
