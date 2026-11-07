"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { addDays, dayKey, parseDayKey } from "@/lib/analysis/time";
import { formatDayShort, formatTime, toTimeInput } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useToday } from "@/lib/hooks/data";
import { ClockIcon } from "@/components/ui/icons";
import { inputClass } from "@/components/ui/controls";

/**
 * "Now · 12:40" chip; tap to pick another date/time. The default is the moment the sheet opened,
 * so logging takes zero extra taps.
 */
export function TimeField({ value, onChange, isNow }: { value: number; onChange: (ts: number) => void; isNow: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const id = useId();
  const today = useToday();
  const date = dayKey(value);
  const dayLabel =
    date === today ? t("common.today") : date === addDays(today, -1) ? t("common.yesterday") : formatDayShort(date, locale);
  const label = isNow ? t("entry.timeNow", { time: formatTime(value, locale) }) : t("entry.timeAt", { day: dayLabel, time: formatTime(value, locale) });

  const setDate = (d: string) => {
    if (!d) return;
    const base = parseDayKey(d);
    const cur = new Date(value);
    base.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
    onChange(base.getTime());
  };
  const setTime = (hm: string) => {
    if (!hm) return;
    const [h, m] = hm.split(":").map(Number);
    const d = new Date(value);
    d.setHours(h, m, 0, 0);
    onChange(d.getTime());
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-4 font-mono text-sm font-medium transition-colors",
          open ? "border-ink bg-ink text-paper" : "border-line-strong bg-card text-ink hover:border-ink",
        )}
      >
        <ClockIcon size={17} />
        <span className="tabular">{label}</span>
        <span className="sr-only">— {t("entry.changeTime")}</span>
      </button>
      {open ? (
        <div id={id} className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">{t("common.date")}</span>
            <input type="date" className={inputClass} value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">{t("common.time")}</span>
            <input type="time" className={inputClass} value={toTimeInput(value)} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
      ) : null}
    </div>
  );
}
