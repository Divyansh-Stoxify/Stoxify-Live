import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/server-session";

/**
 * GET /api/analyst/subscribers — List subscribers across the analyst's plans.
 *
 * Query params forwarded: plan_id, status, limit, page.
 * The subscription-service filters results to plans owned by the JWT caller.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jwtPayload = decodeJwtPayload(accessToken);
  const analystId = jwtPayload?.user_id;

  const { searchParams } = request.nextUrl;
  const query: Record<string, string | undefined> = {
    plan_id: searchParams.get("plan_id") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ?? "50",
    page: searchParams.get("page") ?? "1",
  };

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.subscription,
      path: "/subscriptions/",
      method: "GET",
      deviceId,
      accessToken,
      query,
      extraHeaders: forwardedIpHeaders(request),
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json().catch(() => ({}));
    const rawSubscriptions = data.subscriptions ?? data.data ?? data ?? [];
    const subList = Array.isArray(rawSubscriptions) ? rawSubscriptions : [];

    const internalSecret = process.env.INTERNAL_SECRET;

    // 1. Fetch plans for this analyst internally (to map plan names and billing cycles)
    let plans: any[] = [];
    if (analystId) {
      try {
        const plansResponse = await signedBackendFetch({
          baseUrl: backendUrls.plan,
          path: `/plans/internal/analysts/${analystId}/plans`,
          method: "GET",
          deviceId,
          extraHeaders: {
            ...forwardedIpHeaders(request),
            "X-Internal-Secret": internalSecret || "",
          },
        });
        if (plansResponse.ok) {
          const plansJson = await plansResponse.json().catch(() => []);
          plans = Array.isArray(plansJson) ? plansJson : [];
        }
      } catch (err) {
        console.error("[analyst/subscribers] failed to fetch plans internally:", err);
      }
    }

    // 2. Fetch user profile info (name, email, avatar) for distinct user IDs in parallel
    const distinctUserIds = Array.from(new Set(subList.map((s: any) => s.user_id).filter(Boolean)));
    const userMap = new Map<string, { name: string; profile_pic_url?: string; email?: string }>();

    if (distinctUserIds.length > 0) {
      try {
        await Promise.all(
          distinctUserIds.map(async (uid) => {
            try {
              const userRes = await signedBackendFetch({
                baseUrl: backendUrls.user,
                path: `/users/internal/users/${uid}`,
                method: "GET",
                deviceId,
                extraHeaders: {
                  ...forwardedIpHeaders(request),
                  "X-Internal-Secret": internalSecret || "",
                },
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                userMap.set(uid, {
                  name: userData.name ?? "",
                  profile_pic_url: userData.profile_pic_url ?? userData.avatar_url ?? undefined,
                  email: userData.email ?? "",
                });
              }
            } catch (err) {
              console.error(`[analyst/subscribers] failed to fetch user ${uid} internally:`, err);
            }
          })
        );
      } catch (err) {
        console.error("[analyst/subscribers] batch user fetch failed:", err);
      }
    }

    // 3. Compose enriched subscriber list
    const enrichedSubscriptions = subList.map((sub: any) => {
      const plan = plans.find((p: any) => p.plan_id === sub.plan_id);
      const user = userMap.get(sub.user_id);
      
      const batch = plan?.batches?.find((b: any) => b.batch_id === sub.batch_id);
      const days = batch ? batch.days : (plan?.days || 30);
      const baseAmount = batch ? (batch.discounted_price ?? batch.price) : (plan?.price || 0);

      let billingCycle: "WEEK" | "MONTH" | "QUARTER" | "YEAR" = "MONTH";
      if (days === 7) billingCycle = "WEEK";
      else if (days === 30) billingCycle = "MONTH";
      else if (days === 90) billingCycle = "QUARTER";
      else if (days >= 365) billingCycle = "YEAR";

      return {
        subscription_id: sub.subscription_id,
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        batch_id: sub.batch_id,
        user_name: user?.name || "Anonymous Subscriber",
        user_avatar: user?.profile_pic_url || undefined,
        user_email: user?.email || undefined,
        plan_name: plan?.name || sub.plan_id || "Standard",
        billing_cycle: billingCycle,
        subscribed_at: sub.start_date || sub.created_at,
        end_date: sub.end_date,
        status: sub.status,
        amount: sub.payment?.amount ?? baseAmount,
      };
    });

    return NextResponse.json({
      subscriptions: enrichedSubscriptions,
      total: data.total ?? enrichedSubscriptions.length,
      page: data.page ?? 1,
      limit: data.limit ?? 50,
    });
  } catch (error) {
    console.error("[analyst/subscribers] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach subscription service" }, { status: 503 });
  }
}

