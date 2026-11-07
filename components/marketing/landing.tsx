import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { ArrowRightIcon, LockIcon, NoEyeIcon, PhoneIcon, ShieldIcon, StressIcon, SymptomIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { PhoneMock } from "./phone-mock";

export async function SiteHeader() {
  const t = await getTranslations("landing.nav");
  const locale = await getLocale();
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-8">
      <Link href="/" aria-label={BRAND.name} className="rounded-lg">
        <Logo size="md" />
      </Link>
      <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
        <a href="#hoe" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-paper-deep sm:inline-flex">
          {t("how")}
        </a>
        <Link href="/privacy" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-paper-deep sm:inline-flex">
          {t("privacy")}
        </Link>
        <Link
          href="/"
          locale={locale === "nl" ? "en" : "nl"}
          className="inline-flex min-h-11 items-center rounded-xl px-3 font-mono text-sm font-semibold uppercase hover:bg-paper-deep"
          aria-label={locale === "nl" ? "English" : "Nederlands"}
        >
          {locale === "nl" ? "EN" : "NL"}
        </Link>
        <Link href="/vandaag" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm font-semibold text-paper riso-shadow [--riso:var(--symptom)] [--shadow-offset:3px]">
          {t("open")}
        </Link>
      </nav>
    </header>
  );
}

export async function Landing() {
  const t = await getTranslations("landing");
  const tags = await getTranslations("tags");
  const kinds = await getTranslations("kinds");
  const marquee = [
    tags("onion-garlic"),
    kinds("stress"),
    tags("dairy-lactose"),
    kinds("sleep"),
    tags("wheat-gluten"),
    t("loopTitle"),
    tags("legumes"),
    tags("carbonated"),
    tags("late-meal"),
  ];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <div className="animate-[rise_0.7s_var(--ease-out-soft)_both]">
          <p className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-card px-3 py-1 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
            <span className="h-2 w-2 rounded-full bg-symptom" /> {t("kicker")}
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.9rem,8.5vw,5.6rem)] font-extrabold leading-[0.92] tracking-[-0.035em]">
            <span className="riso-text block [--riso:var(--stress)]">{t("title")}</span>
            <span className="mt-2 block">
              <span className="bg-[linear-gradient(transparent_58%,var(--symptom)_58%,var(--symptom)_92%,transparent_92%)] [box-decoration-break:clone]">
                {t("titleAccent")}
              </span>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-[1.15rem] leading-relaxed text-ink-soft">{t("lead")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/vandaag"
              className="group inline-flex min-h-14 items-center gap-2 rounded-2xl border-[1.5px] border-ink bg-food px-6 font-display text-lg font-extrabold text-on-spot shadow-[5px_5px_0_0_var(--ink)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              {t("cta")} <ArrowRightIcon size={22} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#hoe" className="inline-flex min-h-14 items-center rounded-2xl px-4 font-semibold underline decoration-2 underline-offset-[6px] hover:decoration-symptom">
              {t("ctaSecondary")}
            </a>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">{t("free")}</p>
        </div>
        <div className="animate-[rise_0.9s_0.15s_var(--ease-out-soft)_both]">
          <PhoneMock />
        </div>
      </section>

      {/* ── Marquee band ───────────────────────────────────────────── */}
      <div className="overflow-hidden py-4" aria-hidden>
      <div className="relative -mx-4 -rotate-1 border-y-[2px] border-ink bg-stress py-3">
        <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-8 whitespace-nowrap font-display text-xl font-extrabold text-on-spot">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-8">
              {m} <span className="h-3 w-3 rounded-full bg-symptom ring-[1.5px] ring-ink" />
            </span>
          ))}
        </div>
      </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="hoe" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-24 sm:px-8" aria-labelledby="steps-title">
        <h2 id="steps-title" className="max-w-xl font-display text-[clamp(2.1rem,5vw,3.4rem)] font-extrabold leading-[0.98]">
          {t("stepsTitle")}
        </h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {(["one", "two", "three"] as const).map((k, i) => (
            <li
              key={k}
              className="paper-card relative p-6 riso-shadow"
              style={{ ["--riso" as string]: ["var(--food)", "var(--symptom)", "var(--sleep)"][i], transform: `rotate(${[-1, 0.6, -0.4][i]}deg)` }}
            >
              <span className="tabular font-mono text-sm font-semibold text-ink-soft">0{i + 1}</span>
              <h3 className="mt-6 font-display text-[2rem] font-extrabold leading-none">{t(`steps.${k}.title`)}</h3>
              <p className="mt-3 text-ink-soft">{t(`steps.${k}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Gut–brain loop ─────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 sm:px-8 md:grid-cols-2" aria-labelledby="loop-title">
        <LoopDiagram />
        <div>
          <h2 id="loop-title" className="font-display text-[clamp(2rem,4.6vw,3.1rem)] font-extrabold leading-[1]">
            {t("loopTitle")}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{t("loopBody")}</p>
        </div>
      </section>

      {/* ── Insight preview ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8" aria-labelledby="insight-title">
        <div className="grid items-center gap-10 rounded-[2rem] border-[1.5px] border-ink bg-card p-6 sm:p-10 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">{t("insightKicker")}</p>
            <h2 id="insight-title" className="mt-3 font-display text-[clamp(2rem,4.6vw,3rem)] font-extrabold leading-[1]">
              {t("insightTitle")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{t("insightBody")}</p>
          </div>
          <InsightMock />
        </div>
      </section>

      {/* ── Privacy (inverted ink block) ───────────────────────────── */}
      <section className="bg-ink text-paper" aria-labelledby="privacy-title">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-stress">{t("privacyKicker")}</p>
            <h2 id="privacy-title" className="mt-3 font-display text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold leading-[0.95] [text-shadow:0.04em_0.04em_0_var(--symptom)]">
              {t("privacyTitle")}
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed opacity-85">{t("privacyBody")}</p>
            <Link href="/privacy" className="mt-7 inline-flex min-h-12 items-center gap-2 font-semibold underline decoration-stress decoration-2 underline-offset-[6px]">
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
              <li key={k} className="flex items-center gap-4 rounded-2xl border-[1.5px] border-paper/25 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-stress text-on-spot">
                  <Icon size={22} />
                </span>
                <span className="font-semibold">{t(`privacyPoints.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8" aria-labelledby="faq-title">
        <h2 id="faq-title" className="font-display text-[clamp(2rem,4.6vw,3rem)] font-extrabold">
          {t("faqTitle")}
        </h2>
        <div className="mt-8 divide-y-[1.5px] divide-line border-y-[1.5px] border-line">
          {([1, 2, 3, 4] as const).map((n) => (
            <details key={n} className="group py-2">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">
                {t(`faq.q${n}`)}
                <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-xl transition-transform group-open:rotate-45 group-open:bg-stress">
                  +
                </span>
              </summary>
              <p className="pb-4 pr-12 text-ink-soft">{t(`faq.a${n}`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border-[2px] border-ink bg-symptom px-6 py-14 text-center text-on-spot sm:px-12">
          <div className="halftone pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-40 [--dot:var(--ink)]" aria-hidden />
          <h2 className="relative mx-auto max-w-2xl font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1]">{t("finalTitle")}</h2>
          <Link
            href="/vandaag"
            className="relative mt-8 inline-flex min-h-14 items-center gap-2 rounded-2xl border-[1.5px] border-ink bg-paper px-6 font-display text-lg font-extrabold text-ink shadow-[5px_5px_0_0_var(--ink)] transition active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {t("cta")} <ArrowRightIcon size={22} />
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
    <footer className="border-t-[1.5px] border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="max-w-md">
          <Logo size="sm" />
          <p className="mt-3 text-sm text-ink-soft">{t("footerDisclaimer")}</p>
        </div>
        <div className="flex flex-col gap-1 text-sm sm:items-end">
          <Link href="/privacy" className="min-h-11 font-semibold underline-offset-4 hover:underline">
            {tn("privacy")}
          </Link>
          <p className="text-ink-soft">{t("footerMade")}</p>
        </div>
      </div>
    </footer>
  );
}

function LoopDiagram() {
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full max-w-md" aria-hidden>
      <circle cx="128" cy="156" r="92" fill="var(--symptom)" opacity="0.92" />
      <circle cx="276" cy="146" r="92" fill="var(--stress)" style={{ mixBlendMode: "multiply" }} />
      <circle cx="132" cy="150" r="92" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="272" cy="150" r="92" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M150 60 C 190 20, 230 20, 262 56" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <path d="M252 46 l12 12 -16 4" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M250 244 C 210 282, 170 282, 140 244" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <path d="M150 254 l-12 -12 16 -4" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(96 124)" color="var(--ink)">
        <SymptomIcon size={64} strokeWidth={1.6} />
      </g>
      <g transform="translate(244 118)" color="var(--ink)">
        <StressIcon size={64} strokeWidth={1.6} />
      </g>
    </svg>
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
    <div className="rounded-[1.4rem] border-[1.5px] border-ink bg-paper p-5 shadow-[6px_6px_0_0_var(--symptom)]" aria-hidden>
      <p className="font-display text-xl font-extrabold leading-tight">
        {t("summary")} <span className="rounded-md bg-food px-1.5 text-on-spot">{t("factor")}</span>.
      </p>
      <div className="perforation my-4" />
      <ul className="space-y-3">
        {rows.map(([label, w, ref]) => (
          <li key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold">{label}</span>
              <span className="tabular font-mono text-xs text-ink-soft">
                <b className="text-ink">{w}%</b> · {ref}%
              </span>
            </div>
            <div className="relative h-3.5 rounded-md bg-paper-deep">
              <div className="absolute inset-y-0 left-0 rounded-md border-[1.5px] border-ink bg-symptom" style={{ width: `${w}%` }} />
              <div className="absolute -inset-y-1 w-[3px] rounded-full bg-ink" style={{ left: `${ref}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
