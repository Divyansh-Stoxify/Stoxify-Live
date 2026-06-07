import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

// Native /users/analysts/pending shortcut on the backend (gated by
// PWR_ANALYST_VERIFY).
export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "user", path: "/users/analysts/pending" });
}
