import { MetadataRoute } from "next";

const SITE_URL = "https://www.stoxify.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/for-analysts", "/profiles/", "/brand", "/llms.txt", "/llms-full.txt"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/trader/",
          "/analyst-onboarding/",
          "/forgot-password",
          "/api/",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-Web",
          "Google-Extended",
          "Bytespider",
          "Applebot-Extended",
        ],
        allow: ["/", "/for-analysts", "/profiles/", "/brand", "/llms.txt", "/llms-full.txt"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/trader/",
          "/analyst-onboarding/",
          "/forgot-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
