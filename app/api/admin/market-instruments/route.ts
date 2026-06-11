import { NextRequest } from "next/server";

import { proxyAdminInternalRequest } from "@/lib/admin/internal-proxy";
import { proxyAdminRequest } from "@/lib/admin/proxy";

// GET is public on the backend (/market-data/instruments) — forward the admin
// JWT through the standard proxy.
export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "marketData", path: "/market-data/instruments" });
}

// POST is interServiceAuth-only on the backend
// (/market-data/internal/instruments). Gate on PWR_MARKET_DATA_MANAGE in the
// BFF and inject the internal secret.
export function POST(request: NextRequest) {
  return proxyAdminInternalRequest({
    request,
    backend: "marketData",
    path: "/market-data/internal/instruments",
    method: "POST",
    requiredPower: "PWR_MARKET_DATA_MANAGE",
  });
}
