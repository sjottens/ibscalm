import { defineRouting } from "next-intl/routing";

export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "nl",
  // Dutch lives at "/", English at "/en". No automatic redirects:
  // the URL alone decides the language, which keeps offline caching predictable.
  localePrefix: "as-needed",
  localeDetection: false,
});
