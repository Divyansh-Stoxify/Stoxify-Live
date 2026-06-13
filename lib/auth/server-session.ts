import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { userCookieNames, userCookieOptions } from "@/lib/auth/cookies";

type JwtPayload = {
  user_id?: string;
  user_type?: string;
  name?: string;
  state?: string;
};

export type UserSessionUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  user_type?: string;
};

export type UserSession =
  | { authenticated: true; user: UserSessionUser; accessToken: string }
  | { authenticated: false };

export function decodeJwtPayload(token: string): JwtPayload | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

export function writeUserTokenCookies(
  response: NextResponse,
  data: {
    access_token: string;
    refresh_token?: string;
    session_id?: string;
    device_id?: string;
    user?: {
      user_id?: string;
      name?: string;
      email?: string;
      phone?: string;
      state?: string;
      user_type?: string;
    };
  }
) {
  response.cookies.set(userCookieNames.accessToken, data.access_token, {
    ...userCookieOptions,
    maxAge: 60 * 60,
  });
  if (data.refresh_token) {
    response.cookies.set(userCookieNames.refreshToken, data.refresh_token, {
      ...userCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (data.session_id) {
    response.cookies.set(userCookieNames.sessionId, data.session_id, {
      ...userCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (data.device_id) {
    response.cookies.set(userCookieNames.deviceId, data.device_id, {
      ...userCookieOptions,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (data.user) {
    const jwt = decodeJwtPayload(data.access_token);
    const user_type = jwt?.user_type ?? data.user.user_type ?? "";
    // Stored without httpOnly so client JS can read display data without hitting /api/auth/me.
    response.cookies.set(
      userCookieNames.userInfo,
      JSON.stringify({
        user_id: data.user.user_id ?? "",
        name: data.user.name ?? "",
        email: data.user.email ?? "",
        phone: data.user.phone ?? "",
        state: data.user.state ?? "",
        user_type,
      }),
      {
        ...userCookieOptions,
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30,
      }
    );
  }
}

export async function clearUserCookies(response: NextResponse) {
  for (const name of Object.values(userCookieNames)) {
    response.cookies.set(name, "", {
      ...userCookieOptions,
      httpOnly: name !== userCookieNames.userInfo,
      maxAge: 0,
    });
  }
  return response;
}

export async function readUserSessionFromCookies(): Promise<UserSession> {
  const store = await cookies();
  const accessToken = store.get(userCookieNames.accessToken)?.value;
  if (!accessToken) return { authenticated: false };

  const jwt = decodeJwtPayload(accessToken);
  if (!jwt?.user_id) return { authenticated: false };

  // email/phone are not in the JWT payload — read from the userInfo cookie set at login.
  let name = jwt.name ?? "";
  let email = "";
  let phone = "";
  let user_type = jwt.user_type ?? "";
  const rawInfo = store.get(userCookieNames.userInfo)?.value;
  if (rawInfo) {
    try {
      const info = JSON.parse(rawInfo) as {
        name?: string;
        email?: string;
        phone?: string;
        user_type?: string;
      };
      name = info.name ?? name;
      email = info.email ?? "";
      phone = info.phone ?? "";
      user_type = info.user_type ?? user_type;
    } catch {
      // ignore malformed cookie
    }
  }

  return {
    authenticated: true,
    user: {
      user_id: jwt.user_id,
      name,
      email,
      phone,
      state: jwt.state ?? "",
      user_type,
    },
    accessToken,
  };
}
