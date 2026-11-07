import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BRAND } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = BRAND.name;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Share image: navy panel, white headline, yellow call to action and the wave mark. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  const navy = "#1b2b48";
  const yellow = "#f5d33d";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: navy, padding: 72, color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 48 48">
            <rect width="48" height="48" rx="12" fill="white" />
            <path d="M10 26c3.5-6 7-6 10 0s5.5 4.5 8 0 5-3 10-1" stroke={navy} strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800, display: "flex" }}>{BRAND.name}</div>
        </div>
        <div style={{ marginTop: 64, fontSize: 30, fontWeight: 700, color: yellow, textTransform: "uppercase", letterSpacing: 2 }}>{t("kicker")}</div>
        <div style={{ marginTop: 16, fontSize: 68, fontWeight: 800, lineHeight: 1.08, maxWidth: 1000 }}>{t("title")}</div>
        <div style={{ marginTop: "auto", display: "flex", gap: 16 }}>
          <div style={{ background: yellow, color: navy, fontSize: 30, fontWeight: 800, padding: "14px 28px", borderRadius: 10 }}>{t("cta")}</div>
          <div style={{ fontSize: 26, opacity: 0.85, display: "flex", alignItems: "center" }}>{t("free")}</div>
        </div>
      </div>
    ),
    size,
  );
}
