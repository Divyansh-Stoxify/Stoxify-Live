import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ analystId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { analystId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/users/analysts/${encodeURIComponent(analystId)}/block`,
  });
}
