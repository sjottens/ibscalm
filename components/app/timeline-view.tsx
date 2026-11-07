"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getEntriesBetween } from "@/lib/db/repo";
import { useDayLog, useEntriesForDay, useNow, useToday } from "@/lib/hooks/data";
import { addDays, atHour, dayKey, localHour, parseDayKey } from "@/lib/analysis/time";
import { formatDayLong, formatWeekdayNarrow, isoWeek } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useUi } from "@/lib/store/ui";
import { ChevronLeftIcon, ChevronRightIcon, SleepIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/controls";
import { ActionDock } from "./action-dock";
import { DayStrip } from "./day-strip";
import { EntryList } from "./entry-list";
import { EmptyIllustration, Skeleton } from "./states";

/** The selected day lives in the URL hash (#2026-11-07), so it survives reloads and works offline. */
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const readHash = () => {
  const h = window.location.hash.slice(1);
  return /^\d{4}-\d{2}-\d{2}$/.test(h) ? h : "";
};

function mondayOf(date: string): string {
  const d = parseDayKey(date);
  return addDays(date, -((d.getDay() + 6) % 7));
}

export function TimelineView() {
  const t = useTranslations();
  const locale = useLocale();
  const today = useToday();
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const date = hash && hash <= today ? hash : today;
  const [direction, setDirection] = useState(0);
  const reduce = useReducedMotion();

  const go = useCallback(
    (next: string) => {
      if (!next || next > today) return;
      setDirection(next > date ? 1 : -1);
      const url = next === today ? window.location.pathname : `#${next}`;
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    [date, today],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,[role=dialog]")) return;
      if (e.key === "ArrowLeft") go(addDays(date, -1));
      if (e.key === "ArrowRight") go(addDays(date, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -70 || info.velocity.x < -500) go(addDays(date, 1));
    else if (info.offset.x > 70 || info.velocity.x > 500) go(addDays(date, -1));
  };

  const isToday = date === today;
  const atForDay = useCallback(() => {
    if (date === dayKey(Date.now())) return Date.now();
    const now = new Date();
    return atHour(date, 0) + (now.getHours() * 60 + now.getMinutes()) * 60_000;
  }, [date]);

  if (!today) return <div className="p-4"><Skeleton className="h-40" /></div>;

  return (
    <div className="px-4 pb-44 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-soft">
            {t("timeline.week")} {isoWeek(date)}
          </p>
          <h1 className="font-display text-[2.2rem] font-extrabold leading-none">{t("timeline.title")}</h1>
        </div>
        {!isToday ? (
          <Button variant="outline" onClick={() => go(today)}>
            {t("timeline.today")}
          </Button>
        ) : null}
      </header>

      <WeekStrip date={date} today={today} onSelect={go} locale={locale} />

      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(addDays(date, -1))}
          aria-label={t("timeline.prev")}
          className="grid h-12 w-12 place-items-center rounded-full border border-line-strong transition hover:border-ink active:scale-90"
        >
          <ChevronLeftIcon />
        </button>
        <h2 className="text-center font-display text-xl font-bold first-letter:uppercase" aria-live="polite">
          {isToday ? t("common.today") : formatDayLong(date, locale)}
        </h2>
        <button
          type="button"
          onClick={() => go(addDays(date, 1))}
          aria-label={t("timeline.next")}
          disabled={isToday}
          className="grid h-12 w-12 place-items-center rounded-full border border-line-strong transition hover:border-ink active:scale-90 disabled:opacity-30"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="relative mt-4 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={date}
            custom={direction}
            variants={{
              enter: (d: number) => (reduce ? { opacity: 0 } : { x: d * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => (reduce ? { opacity: 0 } : { x: d * -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            drag={reduce ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
            className="touch-pan-y"
          >
            <DayPanel date={date} isToday={isToday} />
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-4 text-center text-xs text-ink-soft">{t("timeline.swipeHint")}</p>

      <ActionDock at={atForDay} />
    </div>
  );
}

function WeekStrip({ date, today, onSelect, locale }: { date: string; today: string; onSelect: (d: string) => void; locale: string }) {
  const t = useTranslations("timeline");
  const monday = mondayOf(date);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);
  const from = parseDayKey(monday).getTime();
  const to = parseDayKey(addDays(monday, 7)).getTime() - 1;
  const entries = useLiveQuery(() => getEntriesBetween(from, to), [from, to]);

  const perDay = useMemo(() => {
    const map = new Map<string, { max: number; any: boolean }>();
    for (const e of entries ?? []) {
      const k = dayKey(e.timestamp);
      const cur = map.get(k) ?? { max: 0, any: false };
      cur.any = true;
      if (e.kind === "symptom") cur.max = Math.max(cur.max, e.severity);
      map.set(k, cur);
    }
    return map;
  }, [entries]);

  return (
    <div className="mt-4 grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const info = perDay.get(d);
        const selected = d === date;
        const future = d > today;
        const sev = info?.max ?? 0;
        return (
          <button
            key={d}
            type="button"
            disabled={future}
            onClick={() => onSelect(d)}
            aria-pressed={selected}
            aria-label={`${formatDayLong(d, locale)} — ${sev ? t("maxSeverity", { value: sev }) : t("noSymptoms")}`}
            className={cn(
              "flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-lg border transition",
              selected ? "border-ink bg-ink text-paper" : "border-line-strong bg-card hover:border-ink-soft",
              future && "opacity-35",
            )}
          >
            <span className="text-[0.8rem] font-semibold">{formatWeekdayNarrow(d, locale)}</span>
            <span className="tabular font-display text-lg font-bold leading-none">{parseDayKey(d).getDate()}</span>
            <span
              aria-hidden
              className={cn("h-2 w-2 rounded-full", !info?.any ? "bg-transparent" : sev >= 4 ? "bg-symptom" : "bg-food")}
              style={sev >= 4 ? { transform: `scale(${0.8 + sev / 12})` } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}

function DayPanel({ date, isToday }: { date: string; isToday: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const entries = useEntriesForDay(date);
  const dayLog = useDayLog(date);
  const now = useNow();
  const openDay = useUi((s) => s.openDay);

  if (!entries) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="paper-card p-4">
        <DayStrip entries={entries} nowHour={isToday && now ? localHour(now) : null} className="h-auto w-full" />
        <div className="perforation my-3" />
        <button type="button" onClick={() => openDay(date)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-1 text-left text-sm hover:bg-paper-deep">
          <SleepIcon size={18} className="text-sleep-ink" />
          <span className="font-semibold">{t("kinds.sleep")}</span>
          <span className="text-ink-soft">
            {dayLog?.sleepQuality ? `${t("day.qualityWord", { value: String(dayLog.sleepQuality) })}${dayLog.bedtime ? ` · ${dayLog.bedtime}–${dayLog.wakeTime ?? "?"}` : ""}` : t("today.dayCard.sleepEmpty")}
          </span>
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="flex flex-col items-center paper-card px-6 py-8 text-center">
          <EmptyIllustration variant="day" className="h-20" />
          <p className="mt-3 font-display text-lg font-bold">{t("timeline.empty")}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("timeline.emptyHint")}</p>
        </div>
      ) : (
        <EntryList entries={entries} label={formatDayLong(date, locale)} />
      )}
    </div>
  );
}
