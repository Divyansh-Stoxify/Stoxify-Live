import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * POST /api/analyst/document — Upload a verification document (Aadhaar, PAN, SEBI).
 *
 * Forwards base64 document payload to POST /users/me/document on user-service,
 * which uploads the document to Azure Blob Storage and returns { document_url }.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.document_base64 !== "string" || typeof body.content_type !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/me/document",
      method: "POST",
      deviceId,
      accessToken,
      body: {
        document_base64: body.document_base64,
        content_type: body.content_type,
        doc_type: body.doc_type || "doc",
      },
      extraHeaders: forwardedIpHeaders(request),
      timeoutMs: 45_000,
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/document] POST failed:", error);
    return NextResponse.json({ error: "Unable to reach user service" }, { status: 503 });
  }
}
