import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ bankAccountId: string }> };

/**
 * GET /api/admin/bank-accounts/:id/document
 *
 * Returns a short-lived SAS URL for the proof document. The link expires in
 * minutes and every mint is logged against the reviewer on the backend, so this
 * is not a durable link to hand around.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { bankAccountId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/users/admin/bank-accounts/${encodeURIComponent(bankAccountId)}/document`,
  });
}
