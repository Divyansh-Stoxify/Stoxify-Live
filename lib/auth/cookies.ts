export const userCookieNames = {
  accessToken: "stoxify_user_access_token",
  refreshToken: "stoxify_user_refresh_token",
  sessionId: "stoxify_user_session_id",
  deviceId: "stoxify_user_device_id",
  /** Non-sensitive display data (name, email, user_id). Not httpOnly so client JS can read it. */
  userInfo: "stoxify_user_info",
} as const;

export const userCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
