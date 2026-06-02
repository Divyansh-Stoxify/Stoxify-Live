import { NextRequest, NextResponse } from "next/server";

export function rejectCrossOriginPost(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  if (origin && origin === request.nextUrl.origin) {
    return null;
  }

  return NextResponse.json({ error: "Invalid request origin", code: "FORBIDDEN" }, { status: 403 });
}
