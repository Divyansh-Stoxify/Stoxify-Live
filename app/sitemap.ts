import { MetadataRoute } from "next";
import { backendUrls, signedBackendFetch } from "@/lib/backend/index";

const SITE_URL = "https://www.stoxify.in";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/for-analysts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/brand`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let profileRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/public/analysts",
      method: "GET",
      deviceId: "sitemap-ssr",
    });

    if (res.ok) {
      const data = await res.json();
      const analysts = Array.isArray(data) ? data : data.analysts || [];
      
      profileRoutes = analysts.map((analyst: { username: string; updatedAt?: string }) => ({
        url: `${SITE_URL}/profiles/${analyst.username}`,
        lastModified: analyst.updatedAt ? new Date(analyst.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error("Sitemap dynamic analyst fetch skipped:", err);
  }

  return [...staticRoutes, ...profileRoutes];
}
