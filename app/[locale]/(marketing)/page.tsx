import { Analytics } from "@vercel/analytics/next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BRAND } from "@/lib/brand";
import { Landing, SiteFooter, SiteHeader } from "@/components/marketing/landing";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: BRAND.name,
    description: t("description"),
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, iOS, Android",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: locale,
  };
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Landing />
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Cookieless, anonymous page-view counting — only here, never inside the app. */}
      <Analytics />
    </>
  );
}
