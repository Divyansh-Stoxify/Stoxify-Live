import type { NextConfig } from "next";

import { adminSecurityHeaders } from "./lib/admin/security-headers";

const ADMIN_PATH = "/admin/:path*";
const securityHeaders = Object.entries(adminSecurityHeaders).map(([key, value]) => ({
  key,
  value,
}));

const nextConfig: NextConfig = {
  output: "standalone",
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
