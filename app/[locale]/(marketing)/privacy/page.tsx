import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SiteFooter, SiteHeader } from "@/components/marketing/landing";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title"), alternates: { canonical: locale === "nl" ? "/privacy" : "/en/privacy" } };
}

const SECTIONS = ["where", "account", "analytics", "backup", "control", "medical"] as const;

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-2xl px-5 pb-24 pt-12 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-soft">{t("updated")}</p>
        <h1 className="riso-text mt-3 font-display text-[clamp(2.4rem,7vw,4rem)] font-extrabold leading-[0.95] [--riso:var(--stress)]">{t("title")}</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">{t("intro")}</p>
        <div className="mt-10 space-y-4">
          {SECTIONS.map((s, i) => (
            <section key={s} className="paper-card p-6" aria-labelledby={`p-${s}`}>
              <h2 id={`p-${s}`} className="flex items-baseline gap-3 font-display text-xl font-extrabold">
                <span className="tabular font-mono text-sm text-ink-soft">0{i + 1}</span>
                {t(`sections.${s}.title`)}
              </h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{t(`sections.${s}.body`)}</p>
            </section>
          ))}
        </div>
        <Link href="/" className="mt-10 inline-flex min-h-12 items-center gap-2 font-semibold underline decoration-2 underline-offset-[6px]">
          {t("back")} <ArrowRightIcon size={18} />
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
