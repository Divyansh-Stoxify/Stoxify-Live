import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as {
    state?: string;
    new_state?: string;
    reason?: string;
  };

  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/users/${encodeURIComponent(userId)}/state`,
    body: {
      new_state: payload.new_state ?? payload.state,
      reason: typeof payload.reason === "string" ? payload.reason.trim() : payload.reason,
    },
  });
}
