import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import {
  ArrowRightIcon,
  CheckIcon,
  LockIcon,
  MealIcon,
  NoEyeIcon,
  PhoneIcon,
  ShieldIcon,
  SleepIcon,
  StressIcon,
  SymptomIcon,
} from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "./mobile-menu";
import { PhoneMock } from "./phone-mock";

const ctaClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-[1.0625rem] font-bold text-[#1b2b48] transition-colors hover:bg-accent-hover";
const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";

export const FAQ_KEYS = [1, 2, 3, 4, 5, 6] as const;

export async function SiteHeader() {
  const t = await getTranslations("landing.nav");
  const locale = await getLocale();
  const other = locale === "nl" ? "en" : "nl";
  const navLink = "inline-flex min-h-11 items-center rounded-md px-3 hover:bg-paper-deep";
  return (
    <header className="site-header sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-md supports-[not(backdrop-filter:blur(1px))]:bg-paper">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-6xl items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)] sm:gap-4 sm:px-8">
        <Link href="/" aria-label={`${BRAND.name} — home`} className="inline-flex min-h-12 items-center rounded-md">
          <Logo size="md" />
        </Link>
        <nav aria-label={locale === "nl" ? "Hoofdnavigatie" : "Main navigation"} className="flex shrink-0 items-center gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            <li>
              <Link href="/#hoe-het-werkt" className={navLink}>
                {t("how")}
              </Link>
            </li>
            <li>
              <Link href="/#over-pds" className={navLink}>
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/#vragen" className={navLink}>
                {t("faq")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={navLink}>
                {t("privacy")}
              </Link>
            </li>
          </ul>
          <Link
            href="/"
            locale={other}
            hrefLang={other}
            lang={other}
            title={other === "en" ? "English" : "Nederlands"}
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-bold uppercase hover:bg-paper-deep md:inline-flex"
          >
            {other.toUpperCase()}
          </Link>
          <Link href="/vandaag" prefetch={false} className="ml-1 inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg bg-ink px-3 font-semibold sm:px-4 text-paper hover:opacity-90">
            {t("open")}
          </Link>
          <MobileMenu
            items={[
              { href: "/#hoe-het-werkt", label: t("how") },
              { href: "/#over-pds", label: t("about") },
              { href: "/#vragen", label: t("faq") },
              { href: "/privacy", label: t("privacy") },
            ]}
            language={{ href: "/", locale: other, label: other === "en" ? "English" : "Nederlands" }}
            labels={{ open: t("menu"), close: t("menuClose"), title: t("menuTitle") }}
          />
        </nav>
      </div>
    </header>
  );
}

export async function Landing() {
  const t = await getTranslations("landing");
  const locale = await getLocale();
  const moreUrl =
    locale === "nl" ? "https://www.thuisarts.nl/prikkelbaredarmsyndroom" : "https://www.nhs.uk/conditions/irritable-bowel-syndrome-ibs/";
  const h2 = "text-[clamp(1.8rem,4vw,2.4rem)] font-black leading-tight";

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="bg-paper-deep" aria-labelledby="hero-title">
        <div className={`${container} grid items-center gap-12 py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20`}>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.06em] text-ink-soft">{t("kicker")}</p>
            <h1 id="hero-title" className="mt-3 text-[clamp(2.1rem,5.4vw,3.4rem)] font-black leading-[1.08] tracking-[-0.02em]">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-xl text-[1.15rem] leading-relaxed text-ink-soft">{t("lead")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/vandaag" prefetch={false} className={ctaClass}>
                {t("cta")} <ArrowRightIcon size={20} />
              </Link>
              <a href="#hoe-het-werkt" className="text-link inline-flex min-h-12 items-center font-semibold">
                {t("ctaSecondary")}
              </a>
            </div>
            <ul className="mt-8 grid gap-2 sm:grid-cols-3" aria-label={t("free")}>
              {(["free", "account", "device"] as const).map((k) => (
                <li key={k} className="flex items-center gap-2 text-[0.95rem] font-medium">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-food-wash text-food-ink">
                    <CheckIcon size={15} strokeWidth={3} />
                  </span>
                  {t(`trust.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* ── How it works (navy band) ───────────────────────────────── */}
      <section id="hoe-het-werkt" className="bg-ink text-paper" aria-labelledby="steps-title">
        <div className={`${container} py-16`}>
          <h2 id="steps-title" className={h2}>
            {t("stepsTitle")}
          </h2>
          <p className="mt-2 text-lg opacity-85">{t("stepsLead")}</p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {(["one", "two", "three"] as const).map((k, i) => (
              <li key={k}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-lg font-black text-[#1b2b48]" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-extrabold">{t(`steps.${k}.title`)}</h3>
                <p className="mt-2 leading-relaxed opacity-85">{t(`steps.${k}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── What you can track ─────────────────────────────────────── */}
      <section className={`${container} py-16`} aria-labelledby="track-title">
        <h2 id="track-title" className={h2}>
          {t("trackTitle")}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["meal", MealIcon, "bg-food-wash text-food-ink"],
              ["symptom", SymptomIcon, "bg-symptom-wash text-symptom-ink"],
              ["stress", StressIcon, "bg-stress-wash text-stress-ink"],
              ["sleep", SleepIcon, "bg-sleep-wash text-sleep-ink"],
            ] as const
          ).map(([k, Icon, tone]) => (
            <li key={k} className="paper-card p-5">
              <span className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}>
                <Icon size={24} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">{t(`track.${k}.title`)}</h3>
              <p className="mt-1.5 leading-relaxed text-ink-soft">{t(`track.${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── About IBS (informational content) ──────────────────────── */}
      <section id="over-pds" className="border-y border-line bg-paper-deep" aria-labelledby="about-title">
        <div className={`${container} grid gap-10 py-16 md:grid-cols-2`}>
          <div>
            <h2 id="about-title" className={h2}>
              {t("aboutTitle")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed">{t("aboutBody1")}</p>
            <p className="mt-4 text-lg leading-relaxed">{t("aboutBody2")}</p>
            <a href={moreUrl} target="_blank" rel="noopener noreferrer external" className="text-link mt-5 inline-flex min-h-11 items-center gap-1 font-semibold">
              {t("aboutMore")} <ArrowRightIcon size={18} />
            </a>
          </div>
          <div className="paper-card self-start p-6">
            <h3 className="text-xl font-extrabold">{t("loopTitle")}</h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{t("loopBody")}</p>
          </div>
        </div>
      </section>

      {/* ── Insights ───────────────────────────────────────────────── */}
      <section className={`${container} grid items-center gap-10 py-16 md:grid-cols-2`} aria-labelledby="insight-title">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.06em] text-ink-soft">{t("insightKicker")}</p>
          <h2 id="insight-title" className={`mt-2 ${h2}`}>
            {t("insightTitle")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("insightBody")}</p>
        </div>
        <InsightMock />
      </section>

      {/* ── Privacy ────────────────────────────────────────────────── */}
      <section className="bg-ink text-paper" aria-labelledby="privacy-title">
        <div className={`${container} grid gap-10 py-16 md:grid-cols-[1.2fr_1fr]`}>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.06em] text-accent">{t("privacyKicker")}</p>
            <h2 id="privacy-title" className={`mt-2 ${h2}`}>
              {t("privacyTitle")}
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed opacity-90">{t("privacyBody")}</p>
            <Link href="/privacy" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-accent underline underline-offset-4">
              {t("privacyLink")} <ArrowRightIcon size={18} />
            </Link>
          </div>
          <ul className="grid content-center gap-3">
            {(
              [
                ["device", PhoneIcon],
                ["noAccount", LockIcon],
                ["noTracking", NoEyeIcon],
                ["export", ShieldIcon],
              ] as const
            ).map(([k, Icon]) => (
              <li key={k} className="flex items-center gap-4 rounded-lg bg-white/[0.06] p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[#1b2b48]">
                  <Icon size={20} />
                </span>
                <span className="font-semibold">{t(`privacyPoints.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section id="vragen" className="mx-auto max-w-3xl px-5 py-16 sm:px-8" aria-labelledby="faq-title">
        <h2 id="faq-title" className={h2}>
          {t("faqTitle")}
        </h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {FAQ_KEYS.map((n) => (
            <details key={n} className="faq-item group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
                <h3 className="text-lg font-bold">{t(`faq.q${n}`)}</h3>
                <span
                  aria-hidden
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-deep text-xl transition-[transform,background-color] duration-300 ease-[var(--ease-out-soft)] group-open:rotate-45 group-open:bg-accent group-open:text-[#1b2b48]"
                >
                  +
                </span>
              </summary>
              <p className="faq-answer pb-5 pr-10 leading-relaxed text-ink-soft">{t(`faq.a${n}`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="bg-paper-deep" aria-labelledby="final-title">
        <div className={`${container} flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between`}>
          <div>
            <h2 id="final-title" className="text-[clamp(1.6rem,3.5vw,2.1rem)] font-black">
              {t("finalTitle")}
            </h2>
            <p className="mt-1 text-lg text-ink-soft">{t("finalBody")}</p>
          </div>
          <Link href="/vandaag" prefetch={false} className={ctaClass}>
            {t("cta")} <ArrowRightIcon size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("landing");
  const tn = await getTranslations("landing.nav");
  return (
    <footer className="bg-ink text-paper">
      <div className={`${container} grid gap-8 py-12 md:grid-cols-[2fr_1fr]`}>
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[#1b2b48]">
            <Logo size="sm" />
          </span>
          <p className="mt-4 leading-relaxed opacity-85">{t("footerDisclaimer")}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid gap-1">
            <li>
              <Link href="/vandaag" prefetch={false} className="inline-flex min-h-11 items-center font-semibold hover:underline">
                {tn("open")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="inline-flex min-h-11 items-center font-semibold hover:underline">
                {tn("privacy")}
              </Link>
            </li>
          </ul>
          <p className="mt-3 text-sm opacity-75">
            © 2026 {BRAND.name} · {t("footerMade")}
          </p>
        </nav>
      </div>
    </footer>
  );
}

async function InsightMock() {
  const t = await getTranslations("landing.mock");
  const tags = await getTranslations("tags");
  const rows: [string, number, number][] = [
    [tags("onion-garlic"), 92, 21],
    [tags("legumes"), 78, 25],
    [tags("wheat-gluten"), 41, 27],
    [tags("dairy-lactose"), 30, 31],
  ];
  return (
    <div className="paper-card riso-shadow p-6" aria-hidden>
      <p className="text-xl font-extrabold leading-snug">
        {t("summary")} <span className="rounded bg-food-wash px-1.5 text-food-ink">{t("factor")}</span>
      </p>
      <div className="perforation my-4" />
      <ul className="space-y-3.5">
        {rows.map(([label, w, ref]) => (
          <li key={label}>
            <div className="mb-1 flex justify-between text-[0.95rem]">
              <span className="font-semibold">{label}</span>
              <span className="tabular text-ink-soft">
                <b className="text-ink">{w}%</b> · {ref}%
              </span>
            </div>
            <div className="relative h-3 rounded bg-paper-deep">
              <div className="absolute inset-y-0 left-0 rounded bg-symptom" style={{ width: `${w}%` }} />
              <div className="absolute -inset-y-1 w-[3px] rounded-full bg-ink" style={{ left: `${ref}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
