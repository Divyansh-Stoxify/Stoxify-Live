import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ subscriptionId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { subscriptionId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "subscription",
    path: `/subscriptions/${encodeURIComponent(subscriptionId)}/refund`,
  });
}
