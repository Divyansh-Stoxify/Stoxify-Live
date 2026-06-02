import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ key: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { key } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/admin/system-config/${encodeURIComponent(key)}`,
  });
}
