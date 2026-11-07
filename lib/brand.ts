/**
 * Single source of truth for the product name.
 * Every "{brand}" in messages/*.json is replaced with this name at load time.
 */
export const BRAND = {
  name: "IBSCalm",
  domain: "ibscalm.com",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
} as const;
