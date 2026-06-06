export const adminCookieNames = {
  accessToken: "stoxify_admin_access_token",
  refreshToken: "stoxify_admin_refresh_token",
  sessionId: "stoxify_admin_session_id",
  deviceId: "stoxify_admin_device_id",
} as const;

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
