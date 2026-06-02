import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "rbac", path: "/rbac/powers" });
}

export function POST(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "rbac", path: "/rbac/powers" });
}
