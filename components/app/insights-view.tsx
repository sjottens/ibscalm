"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Factor, GroupComparison, RateComparison } from "@/lib/analysis";
import { useAnalysis, useTagLabel } from "@/lib/hooks/data";
import { percent } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ChartCard, CompareBars } from "@/components/charts/compare-bars";
import { FoodChart } from "@/components/charts/food-chart";
import { RhythmChart } from "@/components/charts/rhythm-chart";
import { ArrowRightIcon, DownloadIcon, InfoIcon } from "@/components/ui/icons";
import { EmptyState, Skeleton } from "./states";

const factorColor: Record<Factor, string> = {
  food: "bg-food",
  stress: "bg-stress",
  sleep: "bg-sleep",
};

export function InsightsView() {
  const t = useTranslations("insights");
  const tagLabel = useTagLabel();
  const data = useAnalysis();

  if (!data) {
    return (
      <div className="space-y-4 px-4 pt-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { result, config } = data;
  const { summary } = result;

  if (summary.daysTracked === 0) {
    return (
      <div className="px-4 pt-5">
        <h1 className="font-display text-[2.2rem] font-extrabold">{t("title")}</h1>
        <EmptyState
          variant="chart"
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={
            <Link href="/vandaag" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 font-bold text-[#1b2b48]">
              {t("emptyCta")} <ArrowRightIcon size={18} />
            </Link>
          }
        />
      </div>
    );
  }

  const collecting = summary.status === "collecting";
  const c = summary.counts;

  return (
    <div className="space-y-5 px-4 pb-10 pt-5">
      <header>
        <p className="text-sm font-semibold text-ink-soft">
          {t("nDays", { n: summary.daysTracked })}
        </p>
        <h1 className="font-display text-[2.2rem] font-extrabold leading-none">{t("title")}</h1>
      </header>

      {collecting ? <Collecting days={summary.daysTracked} min={summary.minDays} progress={summary.progress} /> : null}

      {/* Summary — the pull quote */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="paper-card relative overflow-hidden border-l-4 border-l-ink p-5"
        aria-labelledby="summary-title"
      >
        <p className="text-sm font-semibold text-ink-soft">{t("summaryKicker")}</p>
        {summary.status === "found" ? (
          <h2 id="summary-title" className="mt-2 text-[1.6rem] font-black leading-tight">
            {t("summaryFound")}{" "}
            {summary.factors.map((f, i) => (
              <span key={f}>
                {i > 0 ? ` ${t("and")} ` : null}
                <span className={cn("rounded-md px-1.5 text-on-spot [box-decoration-break:clone]", factorColor[f])}>{t(`factor.${f}`)}</span>
              </span>
            ))}
            .
          </h2>
        ) : (
          <h2 id="summary-title" className="mt-2 font-display text-[1.6rem] font-extrabold leading-tight">
            {t("summaryUnclear")}
          </h2>
        )}
        {summary.status === "found" && summary.factors.includes("food") && summary.topFoodTags.length ? (
          <p className="mt-3 font-semibold">{t("foodDetail", { tags: summary.topFoodTags.map(tagLabel).join(", ") })}</p>
        ) : null}
        {summary.status === "unclear" ? <p className="mt-2 text-ink-soft">{t("summaryUnclearBody")}</p> : null}
        {collecting ? <p className="mt-2 text-sm font-semibold text-symptom-ink">{t("collectingPreview")}</p> : null}

        <div className="perforation my-4" />
        <p className="text-sm text-ink-soft">
          {t("basedOn", { days: summary.daysTracked, meals: c.meals, symptoms: c.symptoms, stress: c.stress })}
        </p>
        <p className="mt-3 inline-flex items-center gap-2 text-sm">
          <span className="font-semibold">{t("confidence.label")}:</span>
          <ConfidenceBadge level={summary.confidence} label={t(`confidence.${summary.confidence}`)} />
        </p>
      </motion.section>

      <p className="flex gap-2 rounded-2xl bg-paper-deep p-3.5 text-sm text-ink-soft">
        <InfoIcon size={20} className="mt-px shrink-0 text-ink" />
        {t("disclaimer")}
      </p>

      <ReportCta />

      <ChartCard id="rhythm" title={t("rhythm.title")} body={t("rhythm.body")} riso="var(--sleep)">
        <RhythmChart days={result.days} />
      </ChartCard>

      <ChartCard
        id="food"
        title={t("food.title")}
        body={t("food.body", { min: config.food.minHours, max: config.food.maxHours, threshold: config.severityThreshold })}
        riso="var(--food)"
      >
        <FoodChart tags={result.food.tags} config={config} tagLabel={tagLabel} />
      </ChartCard>

      <ChartCard id="stress" title={t("stress.title")} body={t("stress.body", { hours: config.stress.afterHours })} riso="var(--stress)">
        {result.stress.all.exposed.n === 0 ? (
          <p className="text-sm text-ink-soft">{t("stress.empty")}</p>
        ) : (
          <CompareBars
            spot="stress"
            label={t("stress.title")}
            rows={[
              rateRow(t("stress.after"), result.stress.all, true),
              ...(result.stress.anticipatory.exposed.n ? [rateRow(t("stress.anticipatory"), result.stress.anticipatory, true)] : []),
              { label: t("stress.other"), value: result.stress.all.reference.rate, display: percent(result.stress.all.reference.rate) },
            ]}
          />
        )}
        <div className="perforation my-5" />
        <h3 className="font-display text-lg font-bold">{t("stress.daysTitle")}</h3>
        <p className="mb-3 mt-0.5 text-sm text-ink-soft">{t("stress.daysBody")}</p>
        <GroupBars g={result.stressDays} exposed={t("stress.high")} reference={t("stress.low")} spot="stress" empty={t("stress.empty")} />
      </ChartCard>

      <ChartCard id="sleep" title={t("sleep.title")} body={t("sleep.body")} riso="var(--sleep)">
        <GroupBars g={result.sleepDays} exposed={t("sleep.poor")} reference={t("sleep.good")} spot="sleep" empty={t("sleep.empty")} />
      </ChartCard>

      <ChartCard id="late" title={t("late.title")} body={t("late.body", { hour: config.lateEating.hour })} riso="var(--symptom)">
        {result.lateEating.exposed.n === 0 || result.lateEating.reference.n === 0 ? (
          <p className="text-sm text-ink-soft">{t("late.empty")}</p>
        ) : (
          <CompareBars
            spot="symptom"
            label={t("late.title")}
            rows={[
              rateRow(t("late.late"), result.lateEating, true),
              { label: t("late.other"), value: result.lateEating.reference.rate, display: percent(result.lateEating.reference.rate), sub: `n=${result.lateEating.reference.n}` },
            ]}
          />
        )}
      </ChartCard>

      <Link href="/instellingen#analyse" className="flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink">
        {t("settingsLink")} <ArrowRightIcon size={16} />
      </Link>
    </div>
  );

  function rateRow(label: string, c: RateComparison, emphasis: boolean) {
    return { label, value: c.exposed.rate, display: percent(c.exposed.rate), sub: `${c.exposed.hits}/${c.exposed.n}`, emphasis };
  }
}

function ReportCta() {
  const t = useTranslations("reportPage");
  return (
    <Link href="/rapport" className="paper-card flex items-center gap-4 border-l-4 border-l-accent p-4 transition hover:bg-paper-deep">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-stress-wash text-stress-ink">
        <DownloadIcon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{t("ctaTitle")}</span>
        <span className="block text-sm text-ink-soft">{t("ctaBody")}</span>
      </span>
      <ArrowRightIcon size={20} className="shrink-0" />
    </Link>
  );
}

function GroupBars({ g, exposed, reference, spot, empty }: { g: GroupComparison; exposed: string; reference: string; spot: "stress" | "sleep"; empty: string }) {
  const t = useTranslations("insights");
  if (g.exposed.n === 0 || g.reference.n === 0) return <p className="text-sm text-ink-soft">{empty}</p>;
  const fmt = (v: number | null) => (v === null ? "–" : v.toFixed(1).replace(".", ","));
  return (
    <CompareBars
      spot={spot}
      max={10}
      label={exposed}
      rows={[
        { label: exposed, value: g.exposed.mean, display: t("avg", { value: fmt(g.exposed.mean) }), sub: t("nDays", { n: g.exposed.n }), emphasis: true },
        { label: reference, value: g.reference.mean, display: t("avg", { value: fmt(g.reference.mean) }), sub: t("nDays", { n: g.reference.n }) },
      ]}
    />
  );
}

function ConfidenceBadge({ level, label }: { level: "low" | "medium" | "high"; label: string }) {
  const filled = level === "low" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ink px-2.5 py-0.5">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("h-2.5 w-1.5 rounded-sm", i <= filled ? "bg-ink" : "bg-line-strong")} />
        ))}
      </span>
      <span className="font-semibold">{label}</span>
    </span>
  );
}

function Collecting({ days, min, progress }: { days: number; min: number; progress: number }) {
  const t = useTranslations("insights");
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <section className="flex items-center gap-4 paper-card p-4" aria-labelledby="collecting-title">
      <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${days}/${min}`} className="shrink-0">
        <circle cx="44" cy="44" r={R} fill="none" stroke="var(--paper-deep)" strokeWidth="10" />
        <motion.circle
          cx="44"
          cy="44"
          r={R}
          fill="none"
          stroke="var(--symptom)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - progress) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="50" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ink)" fontFamily="var(--font-figtree)">
          {days}/{min}
        </text>
      </svg>
      <div>
        <h2 id="collecting-title" className="font-display text-lg font-extrabold leading-tight">
          {t("collectingTitle")}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{t("collectingBody", { min, days })}</p>
      </div>
    </section>
  );
}
