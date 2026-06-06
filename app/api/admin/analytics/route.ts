import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames } from "@/lib/admin/cookies";
import { forwardedIpHeaders } from "@/lib/admin/server-session";

type BackendKey = keyof typeof backendUrls;

type UserRecord = {
  created_at?: string;
};

type AnalystRecord = {
  created_at?: string;
};

type SubscriptionRecord = {
  created_at?: string;
};

type TradeRecord = {
  entry_timestamp?: string;
  exit_timestamp?: string;
  pnl_percent?: number;
  status?: string;
};

type UserListResponse = {
  users?: UserRecord[];
};

type AnalystListResponse = {
  analysts?: AnalystRecord[];
};

type SubscriptionListResponse = {
  subscriptions?: SubscriptionRecord[];
};

type TradeListResponse = {
  trades?: TradeRecord[];
};

async function fetchAdminList<T>(
  request: NextRequest,
  {
    accessToken,
    backend,
    deviceId,
    path,
    query,
  }: {
    accessToken: string;
    backend: BackendKey;
    deviceId: string;
    path: string;
    query?: Record<string, string | number | undefined>;
  }
): Promise<T | null> {
  try {
    const response = await signedBackendFetch({
      baseUrl: backendUrls[backend],
      path,
      method: "GET",
      accessToken,
      deviceId,
      query,
      extraHeaders: forwardedIpHeaders(request),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

function isWithinWindow(value: string | undefined, sinceMs: number) {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed >= sinceMs;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const store = await cookies();
  const accessToken = store.get(adminCookieNames.accessToken)?.value;
  const deviceId = store.get(adminCookieNames.deviceId)?.value;

  if (!accessToken || !deviceId) {
    return NextResponse.json(
      { error: "Admin session required", code: "NO_SESSION" },
      { status: 401 }
    );
  }

  const windowDays = 30;
  const sinceMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const sinceIso = new Date(sinceMs).toISOString();

  const [users, analysts, subscriptions, trades] = await Promise.all([
    fetchAdminList<UserListResponse>(request, {
      accessToken,
      backend: "user",
      deviceId,
      path: "/users",
      query: { limit: 100 },
    }),
    fetchAdminList<AnalystListResponse>(request, {
      accessToken,
      backend: "user",
      deviceId,
      path: "/users/analysts",
      query: { limit: 100 },
    }),
    fetchAdminList<SubscriptionListResponse>(request, {
      accessToken,
      backend: "subscription",
      deviceId,
      path: "/subscriptions",
      query: { limit: 100 },
    }),
    fetchAdminList<TradeListResponse>(request, {
      accessToken,
      backend: "trade",
      deviceId,
      path: "/trades",
      query: { limit: 100 },
    }),
  ]);

  const userRecords = users?.users ?? [];
  const analystRecords = analysts?.analysts ?? [];
  const subscriptionRecords = subscriptions?.subscriptions ?? [];
  const tradeRecords = trades?.trades ?? [];
  const closedTradeRecords = tradeRecords.filter(
    (trade) => trade.status && trade.status !== "LIVE"
  );
  const closedTradesInWindow = closedTradeRecords.filter((trade) =>
    isWithinWindow(trade.exit_timestamp, sinceMs)
  );
  const winningClosedTrades = closedTradesInWindow.filter((trade) => (trade.pnl_percent ?? 0) > 0);
  const avgPnlPercent =
    closedTradesInWindow.length > 0
      ? closedTradesInWindow.reduce((sum, trade) => sum + (trade.pnl_percent ?? 0), 0) /
        closedTradesInWindow.length
      : 0;

  return NextResponse.json({
    window_days: windowDays,
    since: sinceIso,
    growth: {
      new_users: userRecords.filter((user) => isWithinWindow(user.created_at, sinceMs)).length,
      new_analysts: analystRecords.filter((analyst) => isWithinWindow(analyst.created_at, sinceMs))
        .length,
      new_subscriptions: subscriptionRecords.filter((subscription) =>
        isWithinWindow(subscription.created_at, sinceMs)
      ).length,
    },
    trades: {
      created: tradeRecords.filter((trade) => isWithinWindow(trade.entry_timestamp, sinceMs))
        .length,
      closed: closedTradesInWindow.length,
      avg_pnl_percent: avgPnlPercent,
      win_rate:
        closedTradesInWindow.length > 0
          ? (winningClosedTrades.length / closedTradesInWindow.length) * 100
          : 0,
    },
    security: {
      incidents: 0,
    },
    notifications: [],
  });
}
