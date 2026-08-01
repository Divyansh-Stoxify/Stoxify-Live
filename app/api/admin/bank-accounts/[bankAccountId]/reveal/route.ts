import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

type RouteContext = { params: Promise<{ bankAccountId: string }> };

/**
 * GET /api/admin/bank-accounts/:id/reveal
 *
 * Full decrypted account number, for typing into a bank portal to pay an
 * analyst manually. Requires PWR_BANK_VERIFY; the backend logs every call at
 * WARN against the reviewer who made it.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { bankAccountId } = await context.params;
  return proxyAdminRequest({
    request,
    backend: "user",
    path: `/users/admin/bank-accounts/${encodeURIComponent(bankAccountId)}/reveal`,
  });
}
