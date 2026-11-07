import { DEFAULT_ANALYSIS_CONFIG, type AnalysisConfig } from "./config";
import { analyzeSleepDays, analyzeStressDays, summarizeDays, type DaySummary, type GroupComparison } from "./daily";
import { analyzeFood, type FoodAnalysis } from "./food";
import { clean, type AnalysisInput } from "./input";
import { analyzeLateEating } from "./late-eating";
import type { RateComparison } from "./stats";
import { analyzeStress, type StressAnalysis } from "./stress";
import { summarize, type Summary } from "./summary";

export * from "./config";
export * from "./daily";
export * from "./food";
export * from "./input";
export * from "./late-eating";
export * from "./stats";
export * from "./stress";
export * from "./summary";
export * from "./time";

export interface AnalysisResult {
  days: DaySummary[];
  food: FoodAnalysis;
  stress: StressAnalysis;
  stressDays: GroupComparison;
  sleepDays: GroupComparison;
  lateEating: RateComparison;
  summary: Summary;
}

/** Runs every analysis. Pure: same input, same output. */
export function runAnalysis(raw: AnalysisInput, cfg: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG): AnalysisResult {
  const input = clean(raw);
  const days = summarizeDays(input, cfg);
  const food = analyzeFood(input, cfg);
  const stress = analyzeStress(input, cfg);
  const stressDays = analyzeStressDays(days, cfg);
  const sleepDays = analyzeSleepDays(days, cfg);
  const lateEating = analyzeLateEating(input, cfg);
  const summary = summarize(
    {
      food,
      stress,
      stressDays,
      sleepDays,
      lateEating,
      daysTracked: days.length,
      counts: {
        meals: input.meals.length,
        symptoms: input.symptoms.length,
        significantSymptoms: input.symptoms.filter((s) => s.severity >= cfg.severityThreshold).length,
        stress: input.stress.length,
        dayLogs: input.days.length,
      },
    },
    cfg,
  );
  return { days, food, stress, stressDays, sleepDays, lateEating, summary };
}
