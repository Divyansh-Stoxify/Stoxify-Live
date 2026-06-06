import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AdminLoginPage } from "@/components/admin/admin-login-page";
import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames } from "@/lib/admin/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;

  let isAuthenticated = false;
  if (accessToken && deviceId) {
    try {
      const check = await signedBackendFetch({
        baseUrl: backendUrls.user,
        path: "/admin/dashboard",
        method: "GET",
        accessToken,
        deviceId,
      });
      isAuthenticated = check.ok;
    } catch {
      // fall through to render login
    }
  }

  if (isAuthenticated) {
    redirect("/admin");
  }

  return <AdminLoginPage />;
}
