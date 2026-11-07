import type { AnalysisConfig } from "./config";
import type { GroupComparison } from "./daily";
import type { FoodAnalysis } from "./food";
import type { StressAnalysis } from "./stress";
import type { Confidence, RateComparison } from "./stats";

export type Factor = "food" | "stress" | "sleep";

export interface SummaryInput {
  food: FoodAnalysis;
  stress: StressAnalysis;
  stressDays: GroupComparison;
  sleepDays: GroupComparison;
  lateEating: RateComparison;
  daysTracked: number;
  counts: { meals: number; symptoms: number; significantSymptoms: number; stress: number; dayLogs: number };
}

export interface Summary {
  /**
   * collecting: not enough days yet;
   * unclear: enough days, no factor stands out;
   * found: one or more factors stand out.
   */
  status: "collecting" | "unclear" | "found";
  /** Named factors, strongest first. Empty unless status is "found". */
  factors: Factor[];
  /** Effect strength per factor, 0–1, after shrinking small samples. */
  scores: Record<Factor, number>;
  /** Strongest food tags (clear positive effect, enough meals), max 3. */
  topFoodTags: string[];
  daysTracked: number;
  minDays: number;
  /** 0–1 progress towards minDays. */
  progress: number;
  dataPoints: number;
  counts: SummaryInput["counts"];
  confidence: Confidence;
}

/** Shrinks an effect towards zero for small samples. */
export function shrink(effect: number, n: number, cfg: AnalysisConfig): number {
  return effect * (n / (n + cfg.summary.shrinkage));
}

function rateScore(c: RateComparison, minGroup: number, cfg: AnalysisConfig): number {
  if (c.difference === null || c.exposed.n < minGroup || c.reference.n < minGroup) return 0;
  return shrink(c.difference, c.exposed.n, cfg);
}

function groupScore(g: GroupComparison, cfg: AnalysisConfig): number {
  const min = cfg.summary.minGroup;
  if (g.difference === null || g.exposed.n < min || g.reference.n < min) return 0;
  // Severity difference on a 0–10 scale → 0–1, comparable with probability differences.
  return shrink(g.difference / 10, Math.min(g.exposed.n, g.reference.n), cfg);
}

/** Food tag scores, strongest first. */
export function foodTagScores(input: SummaryInput, cfg: AnalysisConfig): { tag: string; score: number }[] {
  return input.food.tags
    .map((t) => ({ tag: t.tag, score: rateScore(t, cfg.food.minMeals, cfg) }))
    .sort((a, b) => b.score - a.score);
}

export function foodScore(input: SummaryInput, cfg: AnalysisConfig): number {
  const tags = foodTagScores(input, cfg).map((t) => t.score);
  return Math.max(0, rateScore(input.lateEating, cfg.summary.minGroup, cfg), ...tags);
}

export function stressScore(input: SummaryInput, cfg: AnalysisConfig): number {
  const g = cfg.summary.minGroup;
  const s = input.stress;
  return Math.max(
    0,
    rateScore(s.all, g, cfg),
    rateScore(s.anticipatory, g, cfg),
    rateScore(s.regular, g, cfg),
    groupScore(input.stressDays, cfg),
  );
}

export function sleepScore(input: SummaryInput, cfg: AnalysisConfig): number {
  return Math.max(0, groupScore(input.sleepDays, cfg));
}

export function summaryConfidence(daysTracked: number, significantSymptoms: number, cfg: AnalysisConfig): Confidence {
  if (daysTracked < cfg.summary.minDays || significantSymptoms < 5) return "low";
  if (daysTracked >= cfg.summary.minDays * 2 && significantSymptoms >= 12) return "high";
  return "medium";
}

/** "Seems mostly related to: food / stress / sleep / still unclear". */
export function summarize(input: SummaryInput, cfg: AnalysisConfig): Summary {
  const scores: Record<Factor, number> = {
    food: foodScore(input, cfg),
    stress: stressScore(input, cfg),
    sleep: sleepScore(input, cfg),
  };
  const ranked = (Object.keys(scores) as Factor[])
    .filter((f) => scores[f] >= cfg.summary.minEffect)
    .sort((a, b) => scores[b] - scores[a]);
  const top = ranked.length ? scores[ranked[0]] : 0;
  const factors = ranked.filter((f) => scores[f] >= top * cfg.summary.tieRatio);

  const collecting = input.daysTracked < cfg.summary.minDays;
  const status: Summary["status"] = collecting ? "collecting" : factors.length ? "found" : "unclear";

  const topFoodTags = foodTagScores(input, cfg)
    .filter((t) => t.score >= cfg.summary.minEffect)
    .slice(0, 3)
    .map((t) => t.tag);

  const c = input.counts;
  return {
    status,
    factors: status === "found" ? factors : [],
    scores,
    topFoodTags,
    daysTracked: input.daysTracked,
    minDays: cfg.summary.minDays,
    progress: Math.min(1, input.daysTracked / cfg.summary.minDays),
    dataPoints: c.meals + c.symptoms + c.stress + c.dayLogs,
    counts: c,
    confidence: summaryConfidence(input.daysTracked, c.significantSymptoms, cfg),
  };
}
