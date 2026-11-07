import type { StressEvent } from "@/lib/db/types";
import type { AnalysisConfig } from "./config";
import { clean, significantTimes, trackedDays, type AnalysisInput } from "./input";
import { anyInRange, compareRates, rate, type RateComparison } from "./stats";
import { HOUR, atHour } from "./time";

export interface StressAnalysis {
  /** All stress moments vs. reference moments without stress. */
  all: RateComparison;
  /** Anticipatory stress (fear of symptoms) only. */
  anticipatory: RateComparison;
  /** Other stress only. */
  regular: RateComparison;
  /** How many reference moments were sampled. */
  referenceMoments: number;
}

function hitAround(t: number, significant: number[], cfg: AnalysisConfig): boolean {
  return anyInRange(significant, t - cfg.stress.beforeHours * HOUR, t + cfg.stress.afterHours * HOUR);
}

/**
 * Reference moments: every whole hour between referenceStartHour and referenceEndHour on
 * tracked days, leaving out moments whose window overlaps the window of a stress moment.
 */
export function referenceMoments(input: AnalysisInput, cfg: AnalysisConfig): number[] {
  const span = (cfg.stress.beforeHours + cfg.stress.afterHours) * HOUR;
  const stressTimes = input.stress.map((s) => s.timestamp).sort((a, b) => a - b);
  const moments: number[] = [];
  for (const day of trackedDays(input)) {
    for (let h = cfg.stress.referenceStartHour; h <= cfg.stress.referenceEndHour; h++) {
      const t = atHour(day, h);
      if (!anyInRange(stressTimes, t - span, t + span)) moments.push(t);
    }
  }
  return moments;
}

/** Chance of a complaint within the window around stress moments vs. other moments. */
export function analyzeStress(raw: AnalysisInput, cfg: AnalysisConfig): StressAnalysis {
  const input = clean(raw);
  const significant = significantTimes(input.symptoms, cfg);
  const refs = referenceMoments(input, cfg);
  const refHits = refs.filter((t) => hitAround(t, significant, cfg)).length;
  const reference = rate(refHits, refs.length);

  const measure = (events: StressEvent[]) =>
    compareRates(
      rate(events.filter((e) => hitAround(e.timestamp, significant, cfg)).length, events.length),
      reference,
      cfg,
    );

  return {
    all: measure(input.stress),
    anticipatory: measure(input.stress.filter((s) => s.anticipatory)),
    regular: measure(input.stress.filter((s) => !s.anticipatory)),
    referenceMoments: refs.length,
  };
}
