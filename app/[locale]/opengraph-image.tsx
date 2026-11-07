import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BRAND } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = BRAND.name;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Share image: the horizontal logo on the brand's warm cream, headline and call to action below. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  const logo = await readFile(join(process.cwd(), "public/logos/logo-horizontaal@2x.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const navy = "#23485a";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #FFF7F0 0%, #FDEBDF 100%)",
          padding: 72,
          color: navy,
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={logoSrc} width={485} height={160} alt="" />
        <div style={{ marginTop: 48, fontSize: 60, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>{t("title")}</div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ background: navy, color: "white", fontSize: 30, fontWeight: 800, padding: "14px 28px", borderRadius: 12 }}>{t("cta")}</div>
          <div style={{ fontSize: 26, color: "#4a5a75", display: "flex" }}>{t("free")}</div>
        </div>
      </div>
    ),
    size,
  );
}
