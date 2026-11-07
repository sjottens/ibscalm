import type { DayLog, Meal, MealSize, StressEvent, Symptom } from "@/lib/db/types";
import type { AnalysisInput } from "@/lib/analysis";

let n = 0;
const base = () => ({ id: `t-${++n}`, createdAt: 0, updatedAt: 0, deletedAt: null });

/** Local time on 2026-03-<day> (a month without DST changes), so tests are timezone-independent. */
export const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute).getTime();
export const key = (day: number) => `2026-03-${String(day).padStart(2, "0")}`;

export const meal = (ts: number, tags: string[] = [], size: MealSize = "normal"): Meal => ({
  ...base(),
  timestamp: ts,
  description: "test",
  tags,
  size,
});

export const symptom = (ts: number, severity: number): Symptom => ({
  ...base(),
  timestamp: ts,
  types: ["bloating"],
  severity,
});

export const stress = (ts: number, level: number, anticipatory = false): StressEvent => ({
  ...base(),
  timestamp: ts,
  level,
  trigger: "meeting",
  anticipatory,
});

export const dayLog = (day: number, sleepQuality: number | null, stressScore?: number): DayLog => ({
  date: key(day),
  sleepQuality,
  wearable: stressScore === undefined ? undefined : { stressScore },
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
});

export const input = (p: Partial<AnalysisInput>): AnalysisInput => ({
  meals: [],
  symptoms: [],
  stress: [],
  days: [],
  ...p,
});
