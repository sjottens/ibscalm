import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BRAND } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${BRAND.name}`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Riso poster: big headline, pink belly + yellow offset, ink wave, a strip of day marks. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  const ink = "#1d2340";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f1e7", padding: 64, position: "relative", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 800, color: ink }}>
            <div style={{ width: 22, height: 22, borderRadius: 99, background: "#f2668b", boxShadow: "3px 3px 0 #f5c84b" }} />
            {BRAND.name.toLowerCase()}
          </div>
          <div style={{ marginTop: 56, fontSize: 84, fontWeight: 800, lineHeight: 0.95, color: ink, letterSpacing: -3, textShadow: "4px 4px 0 #f5c84b" }}>
            {t("title")}
          </div>
          <div style={{ marginTop: 24, fontSize: 44, fontWeight: 700, color: ink, display: "flex" }}>
            <span style={{ background: "#f2668b", padding: "0 10px" }}>{t("titleAccent")}</span>
          </div>
          <div style={{ marginTop: "auto", fontSize: 24, color: "#4b5072", letterSpacing: 2, textTransform: "uppercase" }}>{t("free")}</div>
        </div>
        <div style={{ position: "absolute", right: 70, top: 120, width: 360, height: 360, display: "flex" }}>
          <div style={{ position: "absolute", left: 22, top: 22, width: 340, height: 340, borderRadius: 999, background: "#f5c84b" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 340, height: 340, borderRadius: 999, background: "#f2668b", border: `5px solid ${ink}` }} />
          <svg width="340" height="340" viewBox="0 0 340 340" style={{ position: "absolute", left: 0, top: 0 }}>
            <path d="M90 175 q 40 -50 80 0 t 80 0" stroke={ink} strokeWidth="14" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, display: "flex" }}>
          <div style={{ flex: 1, background: "#5fbfa0" }} />
          <div style={{ flex: 1, background: "#f2668b" }} />
          <div style={{ flex: 1, background: "#f5c84b" }} />
          <div style={{ flex: 1, background: "#9c8fe0" }} />
        </div>
      </div>
    ),
    size,
  );
}
