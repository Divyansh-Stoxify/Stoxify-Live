/**
 * Stoxify Frontend Environment Configuration
 *
 * Client-side environment config for Next.js/React applications.
 * Works with both local development and hosted environments.
 */

// ── Environment Detection ────────────────────────────────────────
// Check if we should use hosted URLs
const isHostedEnv =
  process.env.NEXT_PUBLIC_NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_USE_HOSTED_URLS === "true";

// ── URL Configurations ─────────────────────────────────────────────

/**
 * Local development URLs
 */
const LOCAL_URLS = {
  // Azure URLs
  // apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io",
  // wsUrl: process.env.NEXT_PUBLIC_WS_URL || "wss://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/ws",
  // rbacUrl: process.env.NEXT_PUBLIC_RBAC_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/rbac",
  // planUrl: process.env.NEXT_PUBLIC_PLAN_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/plans",
  // userUrl: process.env.NEXT_PUBLIC_USER_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/users",
  // marketDataUrl:
  //   process.env.NEXT_PUBLIC_MARKET_DATA_URL ||
  //   "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/market-data",
  // notificationUrl:
  //   process.env.NEXT_PUBLIC_NOTIFICATION_URL ||
  //   "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/notifications",

  // Localhost docker URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost/ws",
  rbacUrl: process.env.NEXT_PUBLIC_RBAC_URL || "http://localhost/rbac",
  planUrl: process.env.NEXT_PUBLIC_PLAN_URL || "http://localhost/plans",
  userUrl: process.env.NEXT_PUBLIC_USER_URL || "http://localhost/users",
  marketDataUrl: process.env.NEXT_PUBLIC_MARKET_DATA_URL || "http://localhost/market-data",
  notificationUrl: process.env.NEXT_PUBLIC_NOTIFICATION_URL || "http://localhost/notifications",
};

/**
 * Hosted environment URLs
 */
const HOSTED_URLS = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "wss://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/ws",
  rbacUrl: process.env.NEXT_PUBLIC_RBAC_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/rbac",
  planUrl: process.env.NEXT_PUBLIC_PLAN_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/plans",
  userUrl: process.env.NEXT_PUBLIC_USER_URL || "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/users",
  marketDataUrl:
    process.env.NEXT_PUBLIC_MARKET_DATA_URL ||
    "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/market-data",
  notificationUrl:
    process.env.NEXT_PUBLIC_NOTIFICATION_URL ||
    "https://stoxify-gateway.thankfulriver-811030ea.centralindia.azurecontainerapps.io/notifications",
};

// ── Active Configuration ───────────────────────────────────────────

const baseUrls = isHostedEnv ? HOSTED_URLS : LOCAL_URLS;

/**
 * Frontend environment configuration
 */
export const env = {
  // Environment info
  isProduction: isHostedEnv,
  isDevelopment: !isHostedEnv,
  nodeEnv: process.env.NEXT_PUBLIC_NODE_ENV || (isHostedEnv ? "production" : "development"),

  // API endpoints
  api: {
    baseUrl: baseUrls.apiUrl,
    auth: {
      login: `${baseUrls.apiUrl}/auth/login`,
      register: `${baseUrls.apiUrl}/auth/register`,
      logout: `${baseUrls.apiUrl}/auth/logout`,
      refresh: `${baseUrls.apiUrl}/auth/refresh`,
      verify: `${baseUrls.apiUrl}/auth/verify`,
    },
    user: {
      profile: `${baseUrls.userUrl}/profile`,
      update: `${baseUrls.userUrl}/update`,
    },
    rbac: {
      permissions: `${baseUrls.rbacUrl}/permissions`,
      roles: `${baseUrls.rbacUrl}/roles`,
    },
    plan: {
      list: `${baseUrls.planUrl}/plans`,
      subscribe: `${baseUrls.planUrl}/subscribe`,
    },
    marketData: {
      prices: `${baseUrls.marketDataUrl}/prices`,
      watchlist: `${baseUrls.marketDataUrl}/watchlist`,
    },
  },

  // WebSocket
  websocket: {
    url: baseUrls.wsUrl,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  },

  // Feature flags
  features: {
    enableSandbox: process.env.NEXT_PUBLIC_ENABLE_SANDBOX !== "false",
    enableMarketData: process.env.NEXT_PUBLIC_ENABLE_MARKET_DATA !== "false",
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === "true",
  },

  // App config
  app: {
    name: "Stoxify",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    frontendUrl:
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      (isHostedEnv ? "https://stoxify.com" : "http://localhost:3000"),
  },

  // External services
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || "",
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || "",
  },
} as const;

// ── Utility Functions ───────────────────────────────────────────────

/**
 * Get the full API URL for a specific endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${env.api.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof env.features): boolean {
  return env.features[feature];
}

/**
 * Log environment config (development only)
 */
export function logEnvConfig(): void {
  if (env.isProduction || typeof window === "undefined") return;

  console.log("═════════════════════════════════════════════════════");
  console.log("🔧 Stoxify Frontend Environment");
  console.log("═════════════════════════════════════════════════════");
  console.log(`Environment: ${env.nodeEnv}`);
  console.log(`API Base URL: ${env.api.baseUrl}`);
  console.log(`WebSocket URL: ${env.websocket.url}`);
  console.log("═════════════════════════════════════════════════════");
}

// ── TypeScript Types ─────────────────────────────────────────────────

export type ApiEndpoint = keyof typeof env.api;
export type FeatureFlag = keyof typeof env.features;
