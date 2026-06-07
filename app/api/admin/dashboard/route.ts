import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

// Backend aggregates everything in a single call now — no need to fan out.
export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "user", path: "/admin/dashboard" });
}
