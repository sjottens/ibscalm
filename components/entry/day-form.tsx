"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { saveDayLog } from "@/lib/db/repo";
import type { DayLog } from "@/lib/db/types";
import { FieldLabel, inputClass, ScalePicker, Stepper } from "@/components/ui/controls";
import { NoteField } from "./note-field";

const QUALITY = [1, 2, 3, 4, 5] as const;

function numberOrNull(v: string, min: number, max: number): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : null;
}

export function DayForm({
  formId,
  date,
  existing,
  onSaved,
  onError,
}: {
  formId: string;
  date: string;
  existing: DayLog | null;
  onSaved: () => void;
  onError: () => void;
}) {
  const t = useTranslations();
  const [bedtime, setBedtime] = useState(existing?.bedtime ?? "");
  const [wakeTime, setWakeTime] = useState(existing?.wakeTime ?? "");
  const [quality, setQuality] = useState<number | null>(existing?.sleepQuality ?? null);
  const [water, setWater] = useState<number>(existing?.water ?? 0);
  const [movement, setMovement] = useState<number>(existing?.movement ?? 0);
  const [stressScore, setStressScore] = useState(existing?.wearable?.stressScore?.toString() ?? "");
  const [hrv, setHrv] = useState(existing?.wearable?.hrv?.toString() ?? "");
  const [readiness, setReadiness] = useState(existing?.wearable?.readiness?.toString() ?? "");
  const [note, setNote] = useState(existing?.note ?? "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const wearable = {
      stressScore: numberOrNull(stressScore, 0, 100),
      hrv: numberOrNull(hrv, 0, 300),
      readiness: numberOrNull(readiness, 0, 100),
    };
    try {
      await saveDayLog(date, {
        bedtime: bedtime || null,
        wakeTime: wakeTime || null,
        sleepQuality: quality,
        water,
        movement,
        wearable: Object.values(wearable).some((v) => v !== null) ? wearable : undefined,
        note: note.trim() || undefined,
      });
      onSaved();
    } catch {
      onError();
    }
  };

  return (
    <form id={formId} onSubmit={submit} className="space-y-7" noValidate>
      <section aria-labelledby={`${formId}-sleep`}>
        <h3 id={`${formId}-sleep`} className="mb-3 text-sm font-semibold text-sleep-ink">
          {t("day.sleepTitle")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("day.bedtime")}</span>
            <input type="time" className={inputClass} value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("day.wakeTime")}</span>
            <input type="time" className={inputClass} value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          </label>
        </div>
        <div className="mt-5">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h4 className="font-display text-[1.05rem] font-bold">{t("day.quality")}</h4>
            {quality ? <span className="text-sm font-semibold text-sleep-ink">{t("day.qualityWord", { value: String(quality) })}</span> : null}
          </div>
          <ScalePicker
            label={t("day.quality")}
            options={QUALITY}
            value={quality}
            onChange={setQuality}
            allowClear
            spot="sleep"
            describe={(v) => `${v} — ${t("day.qualityWord", { value: String(v) })}`}
          />
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel as="h3">{t("day.water")}</FieldLabel>
          <Stepper
            label={t("day.water")}
            value={water}
            onChange={setWater}
            max={30}
            unit={t("common.glasses")}
            decreaseLabel={t("day.decrease", { what: t("day.water").toLowerCase() })}
            increaseLabel={t("day.increase", { what: t("day.water").toLowerCase() })}
          />
        </div>
        <div>
          <FieldLabel as="h3">{t("day.movement")}</FieldLabel>
          <Stepper
            label={t("day.movement")}
            value={movement}
            onChange={setMovement}
            step={10}
            max={600}
            unit={t("common.minutes")}
            decreaseLabel={t("day.decrease", { what: t("day.movement").toLowerCase() })}
            increaseLabel={t("day.increase", { what: t("day.movement").toLowerCase() })}
          />
        </div>
      </section>

      <details className="paper-card group p-4" open={Boolean(existing?.wearable)}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-display text-[1.05rem] font-bold">
          {t("day.wearableTitle")}
          <span aria-hidden className="text-xl transition-transform group-open:rotate-45">+</span>
        </summary>
        <p className="mb-4 text-sm text-ink-soft">{t("day.wearableHint")}</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            [t("day.stressScore"), stressScore, setStressScore],
            [t("day.hrv"), hrv, setHrv],
            [t("day.readiness"), readiness, setReadiness],
          ].map(([label, value, set]) => (
            <label key={label as string} className="block">
              <span className="mb-1 block min-h-8 text-xs font-medium leading-tight text-ink-soft">{label as string}</span>
              <input
                type="number"
                inputMode="numeric"
                className={inputClass + " tabular font-mono"}
                value={value as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
              />
            </label>
          ))}
        </div>
      </details>

      <NoteField value={note} onChange={setNote} />
    </form>
  );
}
