import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SiteFooter, SiteHeader } from "@/components/marketing/landing";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: { canonical: locale === "nl" ? "/privacy" : "/en/privacy", languages: { nl: "/privacy", en: "/en/privacy" } },
  };
}

const SECTIONS = ["where", "account", "analytics", "payment", "backup", "control", "medical"] as const;

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-2xl px-5 pb-24 pt-12 sm:px-8">
        <p className="text-sm font-semibold text-ink-soft">{t("updated")}</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3rem)] font-black leading-tight">{t("title")}</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        <div className="mt-10 space-y-4">
          {SECTIONS.map((s, i) => (
            <section key={s} className="paper-card p-6" aria-labelledby={`p-${s}`}>
              <h2 id={`p-${s}`} className="flex items-baseline gap-3 text-xl font-extrabold">
                <span className="tabular text-sm font-bold text-ink-soft">{i + 1}.</span>
                {t(`sections.${s}.title`)}
              </h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{t(`sections.${s}.body`)}</p>
            </section>
          ))}
        </div>
        <Link href="/" className="text-link mt-10 inline-flex min-h-12 items-center gap-2 font-semibold">
          {t("back")} <ArrowRightIcon size={18} />
        </Link>
      </main>
      <SiteFooter />
      {/* Cookieless, anonymous page-view counting — public pages only, never inside the app. */}
      <Analytics />
    </>
  );
}
