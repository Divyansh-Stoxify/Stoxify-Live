import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "user", path: "/users/internal-team" });
}

// Provision a sub-admin — creates the INTERNAL_TEAM account and assigns its role
// in one call. Backend gates this on PWR_ADMIN_USER_ROLE_ASSIGN.
export function POST(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "user", path: "/users/internal-team" });
}
