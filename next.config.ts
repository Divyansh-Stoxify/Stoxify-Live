import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { adminSecurityHeaders } from "./lib/admin/security-headers";

const ADMIN_PATH = "/admin/:path*";
const securityHeaders = Object.entries(adminSecurityHeaders).map(([key, value]) => ({
  key,
  value,
}));
const projectRoot = dirname(fileURLToPath(import.meta.url));

function preloadSigningKeyFromPath() {
  const keyPath = process.env.ECDSA_PRIVATE_KEY_PATH?.trim();

  if (process.env.ECDSA_PRIVATE_KEY || !keyPath) {
    return;
  }

  const resolvedKeyPath = isAbsolute(keyPath) ? keyPath : resolve(projectRoot, keyPath);

  if (!existsSync(resolvedKeyPath)) {
    return;
  }

  process.env.ECDSA_PRIVATE_KEY = readFileSync(resolvedKeyPath, "utf8");
  process.env.ECDSA_PRIVATE_KEY_PATH = "";
}

preloadSigningKeyFromPath();

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Team workflow relies on `next dev`, which doesn't block on type errors;
    // don't let `next build` (Vercel) fail on them either. Type errors still
    // surface in the IDE and via `tsc --noEmit`.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Profile pictures uploaded to Azure Blob Storage (any storage account).
      { protocol: "https", hostname: "**.blob.core.windows.net" },
      // Legacy stock avatars still referenced by existing profiles.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/admin",
        headers: securityHeaders,
      },
      {
        source: ADMIN_PATH,
        headers: securityHeaders,
      },
      {
        source: "/api/admin/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
