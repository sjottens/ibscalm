import type { AnalysisConfig } from "./config";
import { clean, trackedDays, type AnalysisInput } from "./input";
import { confidenceFor, mean, type Confidence } from "./stats";
import { dayKey, localHour } from "./time";

export interface DaySummary {
  date: string;
  /** Highest symptom severity that day, 0 when none. */
  maxSeverity: number;
  /** Mean severity of logged symptoms, 0 when none. */
  meanSeverity: number;
  symptomCount: number;
  significantCount: number;
  mealCount: number;
  /** Highest stress level (1–5), 0 when none logged. */
  maxStress: number;
  stressCount: number;
  wearableStress: number | null;
  /** Quality of the night before (1–5). */
  sleepQuality: number | null;
  lateMeal: boolean;
}

export function summarizeDays(raw: AnalysisInput, cfg: AnalysisConfig): DaySummary[] {
  const input = clean(raw);
  const map = new Map<string, DaySummary>();
  for (const date of trackedDays(input)) {
    map.set(date, {
      date,
      maxSeverity: 0,
      meanSeverity: 0,
      symptomCount: 0,
      significantCount: 0,
      mealCount: 0,
      maxStress: 0,
      stressCount: 0,
      wearableStress: null,
      sleepQuality: null,
      lateMeal: false,
    });
  }
  const severities = new Map<string, number[]>();
  for (const s of input.symptoms) {
    const d = map.get(dayKey(s.timestamp))!;
    d.maxSeverity = Math.max(d.maxSeverity, s.severity);
    d.symptomCount++;
    if (s.severity >= cfg.severityThreshold) d.significantCount++;
    const list = severities.get(d.date) ?? [];
    list.push(s.severity);
    severities.set(d.date, list);
  }
  for (const [date, list] of severities) map.get(date)!.meanSeverity = mean(list) ?? 0;
  for (const m of input.meals) {
    const d = map.get(dayKey(m.timestamp))!;
    d.mealCount++;
    if (localHour(m.timestamp) >= cfg.lateEating.hour || m.tags.includes("late-meal")) d.lateMeal = true;
  }
  for (const s of input.stress) {
    const d = map.get(dayKey(s.timestamp))!;
    d.maxStress = Math.max(d.maxStress, s.level);
    d.stressCount++;
  }
  for (const log of input.days) {
    const d = map.get(log.date)!;
    d.sleepQuality = log.sleepQuality ?? null;
    d.wearableStress = log.wearable?.stressScore ?? null;
  }
  return [...map.values()];
}

export interface Group {
  n: number;
  /** Mean of each day's highest severity. */
  mean: number | null;
  dates: string[];
}

export interface GroupComparison {
  /** The group expected to be worse (high stress / poor sleep). */
  exposed: Group;
  reference: Group;
  /** exposed.mean - reference.mean on the 0–10 scale. */
  difference: number | null;
  confidence: Confidence;
}

function group(days: DaySummary[]): Group {
  return { n: days.length, mean: mean(days.map((d) => d.maxSeverity)), dates: days.map((d) => d.date) };
}

function compareGroups(exposed: DaySummary[], reference: DaySummary[], cfg: AnalysisConfig): GroupComparison {
  const a = group(exposed);
  const b = group(reference);
  return {
    exposed: a,
    reference: b,
    difference: a.mean === null || b.mean === null ? null : a.mean - b.mean,
    // Each day is worth more than a single moment, hence the factor 2.
    confidence: confidenceFor(Math.min(a.n, b.n) * 2, cfg),
  };
}

export function isHighStressDay(d: DaySummary, cfg: AnalysisConfig): boolean {
  return d.maxStress >= cfg.stress.highLevel || (d.wearableStress ?? -1) >= cfg.stress.wearableHighScore;
}

/** Mean severity on high-stress days vs. low-stress days (days in between are left out). */
export function analyzeStressDays(days: DaySummary[], cfg: AnalysisConfig): GroupComparison {
  const high = days.filter((d) => isHighStressDay(d, cfg));
  const low = days.filter((d) => !isHighStressDay(d, cfg) && d.maxStress <= cfg.stress.lowLevel);
  return compareGroups(high, low, cfg);
}

/** Mean severity after poor nights vs. after good nights. */
export function analyzeSleepDays(days: DaySummary[], cfg: AnalysisConfig): GroupComparison {
  const withSleep = days.filter((d) => d.sleepQuality != null);
  const poor = withSleep.filter((d) => d.sleepQuality! <= cfg.sleep.poorQuality);
  const good = withSleep.filter((d) => d.sleepQuality! >= cfg.sleep.goodQuality);
  return compareGroups(poor, good, cfg);
}
