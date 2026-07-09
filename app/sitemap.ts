import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/sign-in`, priority: 0.5 },
    { url: `${SITE_URL}/sign-up`, priority: 0.5 },
    { url: `${SITE_URL}/onboarding`, priority: 0.7 },
  ];
}
