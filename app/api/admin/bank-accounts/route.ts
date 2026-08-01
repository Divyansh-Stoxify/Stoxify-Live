import { NextRequest } from "next/server";

import { proxyAdminRequest } from "@/lib/admin/proxy";

/**
 * GET /api/admin/bank-accounts — payout-account review queue.
 * Backed by /users/admin/bank-accounts (gated by PWR_BANK_VERIFY).
 * Supports ?status=PENDING_REVIEW|VERIFIED|REJECTED&page&limit.
 */
export function GET(request: NextRequest) {
  return proxyAdminRequest({ request, backend: "user", path: "/users/admin/bank-accounts" });
}
