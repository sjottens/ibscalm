import type { AnalysisConfig } from "./config";

export type Confidence = "low" | "medium" | "high";

export interface Rate {
  n: number;
  hits: number;
  /** hits / n, or null when n = 0. */
  rate: number | null;
}

export interface RateComparison {
  exposed: Rate;
  reference: Rate;
  /** exposed.rate - reference.rate (probability points), null if either is unknown. */
  difference: number | null;
  confidence: Confidence;
}

export function rate(hits: number, n: number): Rate {
  return { n, hits, rate: n === 0 ? null : hits / n };
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function confidenceFor(n: number, cfg: AnalysisConfig): Confidence {
  if (n >= cfg.confidence.high) return "high";
  if (n >= cfg.confidence.medium) return "medium";
  return "low";
}

export function compareRates(exposed: Rate, reference: Rate, cfg: AnalysisConfig): RateComparison {
  const difference = exposed.rate === null || reference.rate === null ? null : exposed.rate - reference.rate;
  return { exposed, reference, difference, confidence: confidenceFor(Math.min(exposed.n, reference.n), cfg) };
}

/** Index of the first element >= value in a sorted array. */
export function lowerBound(sorted: number[], value: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** True when any value in the sorted array lies within [from, to]. */
export function anyInRange(sorted: number[], from: number, to: number): boolean {
  const i = lowerBound(sorted, from);
  return i < sorted.length && sorted[i] <= to;
}
