import type { AnalysisConfig } from "./config";
import { clean, significantTimes, trackedDays, type AnalysisInput } from "./input";
import { anyInRange, compareRates, rate, type RateComparison } from "./stats";
import { addDays, atHour, dayKey, localHour } from "./time";

/**
 * Complaints the next morning after a late meal, compared with evenings without one.
 * Only evenings whose next day was also tracked are counted.
 */
export function analyzeLateEating(raw: AnalysisInput, cfg: AnalysisConfig): RateComparison {
  const input = clean(raw);
  const significant = significantTimes(input.symptoms, cfg);
  const tracked = new Set(trackedDays(input));
  const lateDays = new Set(
    input.meals
      .filter((m) => localHour(m.timestamp) >= cfg.lateEating.hour || m.tags.includes("late-meal"))
      .map((m) => dayKey(m.timestamp)),
  );

  let lateN = 0;
  let lateHits = 0;
  let otherN = 0;
  let otherHits = 0;
  for (const day of tracked) {
    const next = addDays(day, 1);
    if (!tracked.has(next)) continue;
    const hit = anyInRange(
      significant,
      atHour(next, cfg.lateEating.morningStartHour),
      atHour(next, cfg.lateEating.morningEndHour),
    );
    if (lateDays.has(day)) {
      lateN++;
      if (hit) lateHits++;
    } else {
      otherN++;
      if (hit) otherHits++;
    }
  }
  return compareRates(rate(lateHits, lateN), rate(otherHits, otherN), cfg);
}
