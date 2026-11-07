import type { DayLog, Meal, StressEvent, Symptom } from "@/lib/db/types";
import type { AnalysisConfig } from "./config";
import { dayKey } from "./time";

export interface AnalysisInput {
  meals: Meal[];
  symptoms: Symptom[];
  stress: StressEvent[];
  days: DayLog[];
}

const alive = <T extends { deletedAt: number | null }>(xs: T[]) => xs.filter((x) => x.deletedAt == null);
const byTime = <T extends { timestamp: number }>(a: T, b: T) => a.timestamp - b.timestamp;

/** Drops tombstones and sorts chronologically. */
export function clean(input: AnalysisInput): AnalysisInput {
  return {
    meals: alive(input.meals).sort(byTime),
    symptoms: alive(input.symptoms).sort(byTime),
    stress: alive(input.stress).sort(byTime),
    days: alive(input.days).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** Sorted timestamps of symptoms at or above the threshold. */
export function significantTimes(symptoms: Symptom[], cfg: AnalysisConfig): number[] {
  return symptoms
    .filter((s) => s.severity >= cfg.severityThreshold)
    .map((s) => s.timestamp)
    .sort((a, b) => a - b);
}

/** Every day with at least one entry or day log. */
export function trackedDays(input: AnalysisInput): string[] {
  const set = new Set<string>();
  for (const m of input.meals) set.add(dayKey(m.timestamp));
  for (const s of input.symptoms) set.add(dayKey(s.timestamp));
  for (const s of input.stress) set.add(dayKey(s.timestamp));
  for (const d of input.days) set.add(d.date);
  return [...set].sort();
}
