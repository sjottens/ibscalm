/**
 * Single source of truth for the product name.
 * "Mild" is a working title — change it here and in messages/*.json ({brand} placeholders follow automatically).
 */
export const BRAND = {
  name: "Mild",
  domain: "mild.app",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
} as const;
