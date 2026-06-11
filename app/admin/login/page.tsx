import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AdminLoginPage } from "@/components/admin/admin-login-page";
import { adminCookieNames } from "@/lib/admin/cookies";
import { readAdminSession } from "@/lib/admin/server-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;
  const refreshToken = cookieStore.get(adminCookieNames.refreshToken)?.value;

  let isAuthenticated = false;
  if (accessToken && deviceId) {
    const session = await readAdminSession({ accessToken, deviceId }).catch(() => null);
    isAuthenticated = session?.authenticated === true;

    if (!isAuthenticated && session?.code !== "ADMIN_ACCESS_REQUIRED" && refreshToken) {
      redirect("/api/admin/refresh-redirect");
    }
  }

  if (isAuthenticated) {
    redirect("/admin");
  }

  return <AdminLoginPage />;
}
