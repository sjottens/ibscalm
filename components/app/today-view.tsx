"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useDayLog, useEntriesForDay, useNow, useToday, useTrackedDays } from "@/lib/hooks/data";
import { useUi } from "@/lib/store/ui";
import { formatDayShort, isoWeek } from "@/lib/format";
import { localHour } from "@/lib/analysis/time";
import { cn } from "@/lib/cn";
import { DropIcon, SleepIcon, WalkIcon, WatchIcon } from "@/components/ui/icons";
import { ActionDock } from "./action-dock";
import { BackupReminder } from "./backup-reminder";
import { DayStrip } from "./day-strip";
import { EntryList } from "./entry-list";
import { EmptyIllustration, Skeleton } from "./states";

const MIN_DAYS = 14;

export function TodayView() {
  const t = useTranslations();
  const locale = useLocale();
  const today = useToday();
  const entries = useEntriesForDay(today);
  const dayLog = useDayLog(today);
  const tracked = useTrackedDays();
  const openDay = useUi((s) => s.openDay);
  const now = useNow();

  const meals = entries?.filter((e) => e.kind === "meal").length ?? 0;
  const symptoms = entries?.filter((e) => e.kind === "symptom") ?? [];
  const stress = entries?.filter((e) => e.kind === "stress").length ?? 0;
  const maxSeverity = Math.max(0, ...symptoms.map((s) => (s.kind === "symptom" ? s.severity : 0)));
  const mood = !entries?.length ? "empty" : maxSeverity >= 7 ? "rough" : maxSeverity >= 4 ? "mixed" : "calm";
  const days = tracked?.length ?? 0;

  return (
    <div className="px-4 pb-44 pt-[max(env(safe-area-inset-top),1.25rem)]">
      {/* Masthead */}
      <header>
        <div className="flex items-center justify-between font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink-soft">
          <span>{today ? formatDayShort(today, locale) : " "}</span>
          <span>
            {t("timeline.week")} {today ? isoWeek(today) : ""}
          </span>
        </div>
        <div className="perforation mt-2" />
        <motion.h1
          key={mood}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="riso-text mt-4 font-display text-[2.6rem] font-extrabold leading-[0.95] [--riso:var(--stress)]"
        >
          {t(`today.greeting.${mood}`)}
        </motion.h1>
        <p className="mt-2 text-[0.95rem] text-ink-soft">
          {mood === "rough" ? t("today.greeting.roughSub") : t("today.summary", { meals, symptoms: symptoms.length, stress })}
        </p>
      </header>

      {/* Day ticket */}
      <section className="paper-card riso-shadow mt-5 overflow-hidden p-4 [--riso:var(--food)]" aria-label={t("today.dayCard.title")}>
        {entries ? (
          <DayStrip entries={entries} nowHour={now ? localHour(now) : null} className="h-auto w-full" />
        ) : (
          <Skeleton className="h-[72px]" />
        )}
        <div className="perforation my-3" />
        <button
          type="button"
          onClick={() => today && openDay(today)}
          className="-mx-1 grid w-[calc(100%+0.5rem)] grid-cols-3 gap-2 rounded-xl p-1 text-left transition hover:bg-paper-deep"
          aria-label={t("today.dayCard.edit")}
        >
          <Stat icon={<SleepIcon size={18} />} tone="text-sleep-ink" label={t("today.dayCard.sleep")}>
            {dayLog?.sleepQuality ? (
              <span className="inline-flex gap-0.5" aria-label={`${dayLog.sleepQuality}/5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={cn("h-2.5 w-2.5 rounded-full border border-ink/40", i <= dayLog.sleepQuality! ? "bg-sleep" : "bg-paper-deep")} />
                ))}
              </span>
            ) : (
              <span className="text-ink-soft underline decoration-dotted underline-offset-4">{t("today.dayCard.sleepEmpty")}</span>
            )}
          </Stat>
          <Stat icon={<DropIcon size={18} />} tone="text-food-ink" label={t("today.dayCard.water")}>
            <span className="tabular font-mono">{dayLog?.water ?? 0}</span>
          </Stat>
          <Stat
            icon={dayLog?.wearable ? <WatchIcon size={18} /> : <WalkIcon size={18} />}
            tone="text-stress-ink"
            label={dayLog?.wearable ? t("today.dayCard.wearable") : t("today.dayCard.movement")}
          >
            <span className="tabular font-mono">
              {dayLog?.wearable?.stressScore != null ? dayLog.wearable.stressScore : `${dayLog?.movement ?? 0}′`}
            </span>
          </Stat>
        </button>
      </section>

      <BackupReminder />

      {/* Progress punch card */}
      {tracked && days < MIN_DAYS ? (
        <section className="mt-5 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line-strong p-4" aria-label={t("today.progress", { days })}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-lg font-bold">{t("today.progress", { days })}</p>
            <p className="font-mono text-xs text-ink-soft tabular">
              {days}/{MIN_DAYS}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden>
            {Array.from({ length: MIN_DAYS }, (_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{ scale: i < days ? 1 : 0.86 }}
                className={cn("aspect-square rounded-full border-[1.5px]", i < days ? "border-ink bg-symptom" : "border-line-strong")}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">{t("today.progressHint", { left: MIN_DAYS - days })}</p>
        </section>
      ) : null}

      {/* Entries */}
      <section className="mt-6" aria-labelledby="today-entries">
        <h2 id="today-entries" className="mb-3 font-mono text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink-soft">
          {t("today.entriesTitle")}
        </h2>
        {!entries ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center gap-4 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line-strong p-5">
            <EmptyIllustration variant="plate" className="h-20 shrink-0" />
            <div>
              <p className="font-display text-lg font-bold leading-tight">{t("today.emptyTitle")}</p>
              <p className="mt-1 text-sm text-ink-soft">{t("today.emptyBody")}</p>
            </div>
          </div>
        ) : (
          <EntryList entries={entries} label={t("today.entriesTitle")} />
        )}
      </section>

      <ActionDock />
    </div>
  );
}

function Stat({ icon, label, tone, children }: { icon: React.ReactNode; label: string; tone: string; children: React.ReactNode }) {
  return (
    <span className="block min-w-0">
      <span className={cn("flex items-center gap-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em]", tone)}>
        {icon}
        {label}
      </span>
      <span className="mt-1.5 block truncate text-[0.95rem] font-semibold">{children}</span>
    </span>
  );
}
