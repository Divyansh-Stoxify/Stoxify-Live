import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminCookieNames } from "@/lib/admin/cookies";
import { readAdminSession } from "@/lib/admin/server-session";

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;

  if (!accessToken || !deviceId) {
    return NextResponse.json({ authenticated: false, powers: [] }, { status: 401 });
  }

  const session = await readAdminSession({ accessToken, deviceId }).catch(() => null);
  if (!session) {
    return NextResponse.json(
      { authenticated: false, powers: [], error: "Unable to load admin permissions" },
      { status: 503 }
    );
  }

  return NextResponse.json(session, { status: session.authenticated ? 200 : 401 });
}
