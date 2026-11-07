import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/** Only public pages. The app screens hold personal data views and are kept out of search engines. */
export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${BRAND.url}${p}`;
  const lastModified = new Date("2026-11-07");
  return [
    {
      url: u("/"),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { nl: u("/"), en: u("/en") } },
    },
    {
      url: u("/en"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { nl: u("/"), en: u("/en") } },
    },
    {
      url: u("/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: { languages: { nl: u("/privacy"), en: u("/en/privacy") } },
    },
    {
      url: u("/en/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
      alternates: { languages: { nl: u("/privacy"), en: u("/en/privacy") } },
    },
  ];
}
