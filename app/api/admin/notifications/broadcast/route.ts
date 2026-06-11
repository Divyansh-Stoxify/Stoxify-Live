import { NextRequest } from "next/server";

import { proxyAdminInternalRequest } from "@/lib/admin/internal-proxy";

// Backend only exposes /notifications/internal/broadcast (interServiceAuth).
// The BFF authenticates the admin via cookies + PWR_NOTIFICATION_SEND_BROADCAST
// before injecting the internal secret upstream.
export function POST(request: NextRequest) {
  return proxyAdminInternalRequest({
    request,
    backend: "notification",
    path: "/notifications/internal/broadcast",
    method: "POST",
    requiredPower: "PWR_NOTIFICATION_SEND_BROADCAST",
  });
}
