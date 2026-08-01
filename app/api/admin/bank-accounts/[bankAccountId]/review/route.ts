import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ bankAccountId: string }> };

/**
 * POST /api/admin/bank-accounts/:id/review — approve or reject a submission.
 * The backend requires every checklist item ticked before it will approve.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { bankAccountId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/users/admin/bank-accounts/${encodeURIComponent(bankAccountId)}/review`,
  });
}
