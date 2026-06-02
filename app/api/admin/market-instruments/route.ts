import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "marketData", path: "/market-data/instruments" });
}

export function POST(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "marketData", path: "/market-data/instruments" });
}
