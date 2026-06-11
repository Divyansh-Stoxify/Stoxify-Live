import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

// Backend computes the 30-day series natively. Query params (e.g. ?days=30)
// pass straight through.
export function GET(request: NextRequest) {
  return proxyAdminRequest({
    request,
    backend: "user",
    path: "/admin/analytics/overview",
  });
}
