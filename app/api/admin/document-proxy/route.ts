import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * GET /api/admin/document-proxy?url=...
 *
 * Proxies document requests (PDFs, images, verification docs) server-side
 * to bypass CORS / X-Frame-Options / referrer restrictions when displaying
 * document previews in admin dialogs.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;

  if (!accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
    return new NextResponse("Invalid or missing document URL", { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "StoxifyAdminProxy/1.0",
      },
    });

    if (!res.ok) {
      return new NextResponse(`Failed to fetch upstream document: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("[document-proxy] Request failed:", error);
    return new NextResponse("Proxy error fetching document", { status: 502 });
  }
}
