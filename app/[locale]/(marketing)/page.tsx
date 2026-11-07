import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BRAND } from "@/lib/brand";
import { FAQ_KEYS, Landing, SiteFooter, SiteHeader } from "@/components/marketing/landing";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const keywords =
    locale === "nl"
      ? ["PDS dagboek", "prikkelbare darm syndroom", "buikklachten bijhouden", "PDS app", "voedingsdagboek", "FODMAP", "triggers PDS", "stress buikklachten"]
      : ["IBS diary", "irritable bowel syndrome", "symptom tracker", "IBS app", "food diary", "low FODMAP", "IBS triggers"];
  return {
    // Absolute title: the home page carries the full keyword-rich title.
    title: { absolute: t("title") },
    keywords,
    alternates: {
      canonical: locale === "nl" ? "/" : "/en",
      languages: { nl: "/", en: "/en", "x-default": "/" },
    },
    robots: { index: true, follow: true, "max-image-preview": "large" },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  const tl = await getTranslations({ locale, namespace: "landing" });
  const url = `${BRAND.url}${locale === "nl" ? "/" : "/en"}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND.name,
      url: BRAND.url,
      inLanguage: ["nl", "en"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: BRAND.name,
      url,
      description: t("description"),
      applicationCategory: "HealthApplication",
      operatingSystem: "Web, iOS, Android",
      browserRequirements: "Requires a modern browser with JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      inLanguage: locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: FAQ_KEYS.map((n) => ({
        "@type": "Question",
        name: tl(`faq.q${n}`),
        acceptedAnswer: { "@type": "Answer", text: tl(`faq.a${n}`) },
      })),
    },
  ];

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
