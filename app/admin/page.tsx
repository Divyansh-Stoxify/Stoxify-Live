import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { JSX } from "react";

import { AdminContent } from "@/components/admin/admin-content";
import { AppShell } from "@/components/app-shell";
import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames, adminCookieOptions } from "@/lib/admin/cookies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function logout(): Promise<void> {
  "use server";

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;
  const refreshToken = cookieStore.get(adminCookieNames.refreshToken)?.value;

  if (accessToken && deviceId) {
    await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/logout",
      method: "POST",
      accessToken,
      deviceId,
      body: refreshToken ? { refresh_token: refreshToken } : undefined,
    }).catch(() => undefined);
  }

  for (const name of Object.values(adminCookieNames)) {
    cookieStore.set(name, "", { ...adminCookieOptions, maxAge: 0 });
  }

  redirect("/admin/login");
}

export default async function AdminPage(): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;
  const refreshToken = cookieStore.get(adminCookieNames.refreshToken)?.value;

  if (!accessToken || !deviceId) {
    // No access token; try a silent refresh before sending to login.
    if (refreshToken && deviceId) {
      redirect("/api/admin/refresh-redirect");
    }
    redirect("/admin/login");
  }

  let adminCheck: Response;
  try {
    adminCheck = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/admin/dashboard",
      method: "GET",
      accessToken,
      deviceId,
    });
  } catch {
    redirect("/admin/login");
  }

  if (!adminCheck.ok) {
    // 401 means the access token expired. Attempt a silent token refresh once
    // before falling back to the login page.
    if (adminCheck.status === 401 && refreshToken && deviceId) {
      redirect("/api/admin/refresh-redirect");
    }
    redirect("/admin/login");
  }

  return (
    <AppShell logoutAction={logout}>
      <AdminContent />
    </AppShell>
  );
}
