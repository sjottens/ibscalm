import { runAnalysis, type AnalysisConfig, type AnalysisInput, type AnalysisResult } from "@/lib/analysis";
import { addDays, dayKey, parseDayKey } from "@/lib/analysis/time";
import { SYMPTOM_TYPES, type SymptomType } from "@/lib/db/types";

export type ReportPeriod = "14" | "28" | "all";

export interface ReportModel {
  period: { from: string; to: string; days: number };
  generatedAt: number;
  analysis: AnalysisResult;
  symptoms: {
    total: number;
    daysWithSymptoms: number;
    /** Mean of each tracked day's highest severity. */
    meanDailyMax: number | null;
    /** Most frequent symptom types, most common first. */
    types: { type: SymptomType; count: number }[];
    /** Bristol stool types 1–7 → count. */
    bristol: Record<number, number>;
  };
  stress: { total: number; anticipatory: number; meanLevel: number | null };
  meals: { total: number; late: number };
}

/** Keeps only entries within [from, to] (inclusive, local days). */
export function filterPeriod(input: AnalysisInput, from: string, to: string): AnalysisInput {
  const start = parseDayKey(from).getTime();
  const end = parseDayKey(addDays(to, 1)).getTime();
  const inRange = (ts: number) => ts >= start && ts < end;
  return {
    meals: input.meals.filter((m) => inRange(m.timestamp)),
    symptoms: input.symptoms.filter((s) => inRange(s.timestamp)),
    stress: input.stress.filter((s) => inRange(s.timestamp)),
    days: input.days.filter((d) => d.date >= from && d.date <= to),
  };
}

/** Start date for a period, given "today". For "all", the first day with data. */
export function periodStart(input: AnalysisInput, period: ReportPeriod, today: string): string {
  if (period !== "all") return addDays(today, -(Number(period) - 1));
  const times = [...input.meals, ...input.symptoms, ...input.stress].map((e) => e.timestamp);
  const firstEntry = times.length ? dayKey(Math.min(...times)) : today;
  const firstLog = input.days.length ? input.days.map((d) => d.date).sort()[0] : today;
  return firstEntry < firstLog ? firstEntry : firstLog;
}

/** Everything the doctor's report shows, computed from the user's own data (pure, no I/O). */
export function buildReportModel(
  raw: AnalysisInput,
  config: AnalysisConfig,
  period: ReportPeriod,
  today: string,
  now = Date.now(),
): ReportModel {
  const alive = {
    meals: raw.meals.filter((x) => x.deletedAt == null),
    symptoms: raw.symptoms.filter((x) => x.deletedAt == null),
    stress: raw.stress.filter((x) => x.deletedAt == null),
    days: raw.days.filter((x) => x.deletedAt == null),
  };
  const from = periodStart(alive, period, today);
  const input = filterPeriod(alive, from, today);
  const analysis = runAnalysis(input, config);

  const typeCounts = new Map<SymptomType, number>();
  const bristol: Record<number, number> = {};
  for (const s of input.symptoms) {
    for (const t of s.types) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
    if (s.bristol) bristol[s.bristol] = (bristol[s.bristol] ?? 0) + 1;
  }
  const types = SYMPTOM_TYPES.map((type) => ({ type, count: typeCounts.get(type) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const tracked = analysis.days;
  const meanDailyMax = tracked.length ? tracked.reduce((s, d) => s + d.maxSeverity, 0) / tracked.length : null;
  const levels = input.stress.map((s) => s.level);

  return {
    period: { from, to: today, days: Math.round((parseDayKey(today).getTime() - parseDayKey(from).getTime()) / 86_400_000) + 1 },
    generatedAt: now,
    analysis,
    symptoms: {
      total: input.symptoms.length,
      daysWithSymptoms: tracked.filter((d) => d.symptomCount > 0).length,
      meanDailyMax,
      types,
      bristol,
    },
    stress: {
      total: input.stress.length,
      anticipatory: input.stress.filter((s) => s.anticipatory).length,
      meanLevel: levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : null,
    },
    meals: { total: input.meals.length, late: tracked.filter((d) => d.lateMeal).length },
  };
}
