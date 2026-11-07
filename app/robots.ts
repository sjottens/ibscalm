import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    // App screens are crawlable but carry `noindex` (so search engines can see that instruction).
    rules: [{ userAgent: "*", allow: "/", disallow: ["/serwist/"] }],
    sitemap: `${BRAND.url}/sitemap.xml`,
    host: BRAND.url,
  };
}
