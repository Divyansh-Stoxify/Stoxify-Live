import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ analystId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { analystId } = await context.params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { decision, notes, reason } = body;

  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/users/analysts/${encodeURIComponent(analystId)}/verify`,
    body: {
      action: decision,
      verification_notes: notes ?? reason ?? undefined,
    },
  });
}
