import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BRAND } from "@/lib/brand";
import { themeScript } from "@/lib/theme";
import { Providers } from "@/components/app/providers";
import "../globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["opsz"],
  display: "swap",
  // Body text (Geist) is the LCP element; headings may swap in a moment later.
  preload: false,
});
const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(BRAND.url),
    title: { default: t("title"), template: `%s · ${BRAND.name}` },
    description: t("description"),
    applicationName: BRAND.name,
    appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      title: t("title"),
      description: t("description"),
      locale: locale === "nl" ? "nl_NL" : "en_GB",
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/icons/180" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#12142a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed -top-24 left-4 z-[80] inline-flex min-h-12 items-center rounded-xl bg-ink px-4 font-semibold text-paper focus:top-4"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
