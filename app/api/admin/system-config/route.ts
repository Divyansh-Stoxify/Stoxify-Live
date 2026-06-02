import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "user", path: "/admin/system-config" });
}

export function PUT(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "user", path: "/admin/system-config" });
}
