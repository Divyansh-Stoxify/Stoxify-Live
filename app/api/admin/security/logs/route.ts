import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "auth", path: "/auth/security/logs" });
}

export function DELETE(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "auth", path: "/auth/security/logs" });
}
