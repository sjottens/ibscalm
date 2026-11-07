import { describe, expect, it } from "vitest";
import {
  DEFAULT_ANALYSIS_CONFIG as cfg,
  addDays,
  analyzeFood,
  analyzeLateEating,
  analyzeSleepDays,
  analyzeStress,
  analyzeStressDays,
  anyInRange,
  clean,
  compareRates,
  confidenceFor,
  dayKey,
  daysBetween,
  effectiveTags,
  isFollowedBySymptom,
  lowerBound,
  mean,
  rate,
  referenceMoments,
  resolveConfig,
  runAnalysis,
  shrink,
  summarizeDays,
  trackedDays,
} from "@/lib/analysis";
import { generateSeed } from "@/lib/seed/generate";
import { at, dayLog, input, key, meal, stress, symptom } from "./fixtures";

describe("time helpers", () => {
  it("formats local day keys and adds days across month ends", () => {
    expect(dayKey(at(5, 23, 59))).toBe("2026-03-05");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-03-01", "2026-03-15")).toBe(14);
  });

  it("is DST-safe when adding days", () => {
    // Europe switches to summer time on the last Sunday of March.
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });
});

describe("stats helpers", () => {
  it("computes rates and means", () => {
    expect(rate(1, 4)).toEqual({ n: 4, hits: 1, rate: 0.25 });
    expect(rate(0, 0).rate).toBeNull();
    expect(mean([])).toBeNull();
    expect(mean([2, 4])).toBe(3);
  });

  it("finds values in sorted ranges", () => {
    const xs = [1, 5, 9];
    expect(lowerBound(xs, 5)).toBe(1);
    expect(lowerBound(xs, 10)).toBe(3);
    expect(anyInRange(xs, 2, 4)).toBe(false);
    expect(anyInRange(xs, 5, 5)).toBe(true);
    expect(anyInRange([], 0, 100)).toBe(false);
  });

  it("labels confidence by number of data points", () => {
    expect(confidenceFor(3, cfg)).toBe("low");
    expect(confidenceFor(8, cfg)).toBe("medium");
    expect(confidenceFor(20, cfg)).toBe("high");
  });

  it("compares rates and returns null difference when a side is empty", () => {
    expect(compareRates(rate(3, 4), rate(1, 4), cfg).difference).toBe(0.5);
    expect(compareRates(rate(3, 4), rate(0, 0), cfg).difference).toBeNull();
  });
});

describe("config", () => {
  it("merges partial overrides over defaults", () => {
    const c = resolveConfig({ severityThreshold: 6, food: { maxHours: 12 } });
    expect(c.severityThreshold).toBe(6);
    expect(c.food).toEqual({ minHours: 2, maxHours: 12, minMeals: 3 });
    expect(c.stress).toEqual(cfg.stress);
    expect(resolveConfig(null)).toBe(cfg);
  });
});

describe("input cleaning", () => {
  it("drops soft-deleted records and sorts by time", () => {
    const deleted = { ...meal(at(2, 8)), deletedAt: 1 };
    const res = clean(input({ meals: [meal(at(3, 8)), deleted, meal(at(1, 8))] }));
    expect(res.meals.map((m) => dayKey(m.timestamp))).toEqual([key(1), key(3)]);
  });

  it("lists every tracked day once", () => {
    const days = trackedDays(input({ meals: [meal(at(1, 8)), meal(at(1, 12))], days: [dayLog(3, 4)] }));
    expect(days).toEqual([key(1), key(3)]);
  });
});

describe("food analysis", () => {
  it("derives large-meal and late-meal tags", () => {
    expect(effectiveTags(meal(at(1, 21, 30), ["spicy"], "large"), cfg).sort()).toEqual(
      ["large-meal", "late-meal", "spicy"].sort(),
    );
    expect(effectiveTags(meal(at(1, 20, 59)), cfg)).toEqual([]);
  });

  it("counts a complaint only inside the default 2–8 h window and at or above the threshold", () => {
    const m = meal(at(1, 12));
    expect(isFollowedBySymptom(m, [at(1, 13)], cfg)).toBe(false); // 1 h: too soon
    expect(isFollowedBySymptom(m, [at(1, 14)], cfg)).toBe(true); // exactly 2 h
    expect(isFollowedBySymptom(m, [at(1, 20)], cfg)).toBe(true); // exactly 8 h
    expect(isFollowedBySymptom(m, [at(1, 21)], cfg)).toBe(false); // 9 h: too late
    const wide = resolveConfig({ food: { maxHours: 24 } });
    expect(isFollowedBySymptom(m, [at(2, 12)], wide)).toBe(true); // 24 h with a widened window
    expect(isFollowedBySymptom(m, [at(2, 13)], wide)).toBe(false);

    const res = analyzeFood(input({ meals: [m], symptoms: [symptom(at(1, 16), 3)] }), cfg);
    expect(res.baseline.hits).toBe(0); // severity 3 < threshold 4
  });

  it("compares meals with a tag against meals without it", () => {
    const meals = [
      // 3 onion meals, all followed by a complaint
      meal(at(1, 12), ["onion-garlic"]),
      meal(at(3, 12), ["onion-garlic"]),
      meal(at(5, 12), ["onion-garlic"]),
      // 4 plain meals, one followed
      meal(at(7, 12)),
      meal(at(9, 12)),
      meal(at(11, 12)),
      meal(at(13, 12)),
    ];
    const symptoms = [symptom(at(1, 17), 6), symptom(at(3, 17), 5), symptom(at(5, 17), 7), symptom(at(7, 17), 4)];
    const res = analyzeFood(input({ meals, symptoms }), cfg);
    const onion = res.tags.find((t) => t.tag === "onion-garlic")!;
    expect(onion.exposed).toEqual({ n: 3, hits: 3, rate: 1 });
    expect(onion.reference).toEqual({ n: 4, hits: 1, rate: 0.25 });
    expect(onion.difference).toBeCloseTo(0.75);
    expect(res.baseline.rate).toBeCloseTo(4 / 7);
    expect(res.tags[0].tag).toBe("onion-garlic");
  });

  it("handles no data", () => {
    const res = analyzeFood(input({}), cfg);
    expect(res).toEqual({ totalMeals: 0, baseline: { n: 0, hits: 0, rate: null }, tags: [] });
  });

  it("respects a configured window", () => {
    const c = resolveConfig({ food: { maxHours: 4 } });
    const res = analyzeFood(input({ meals: [meal(at(1, 8))], symptoms: [symptom(at(1, 14), 8)] }), c);
    expect(res.baseline.hits).toBe(0);
  });
});

describe("stress analysis", () => {
  it("samples hourly reference moments away from stress", () => {
    const data = input({ meals: [meal(at(1, 8))], stress: [stress(at(1, 12), 4)] });
    const refs = referenceMoments(data, cfg).map((t) => new Date(t).getHours());
    // 8..22 minus hours within ±3 h of 12:00 (9..15)
    expect(refs).toEqual([8, 16, 17, 18, 19, 20, 21, 22]);
  });

  it("compares complaint chance after stress with other moments", () => {
    const data = input({
      stress: [stress(at(1, 10), 4), stress(at(2, 10), 5), stress(at(3, 10), 2, true)],
      symptoms: [symptom(at(1, 11), 6), symptom(at(2, 12, 30), 5), symptom(at(3, 10, 30), 4), symptom(at(3, 20), 5)],
    });
    const res = analyzeStress(data, cfg);
    expect(res.all.exposed).toEqual({ n: 3, hits: 3, rate: 1 });
    // Reference moments 14..22 on 3 days = 27; on 3 March 17:00–20:00 catch the 20:00 complaint.
    expect(res.referenceMoments).toBe(27);
    expect(res.all.reference.hits).toBe(4);
    expect(res.anticipatory.exposed).toEqual({ n: 1, hits: 1, rate: 1 });
    expect(res.regular.exposed.n).toBe(2);
    expect(res.all.difference).toBeCloseTo(1 - 4 / 27);
  });

  it("does not count complaints before the stress moment by default", () => {
    const data = input({ stress: [stress(at(1, 10), 4)], symptoms: [symptom(at(1, 9), 6)] });
    expect(analyzeStress(data, cfg).all.exposed.hits).toBe(0);
    const before = resolveConfig({ stress: { beforeHours: 2 } });
    expect(analyzeStress(data, before).all.exposed.hits).toBe(1);
  });
});

describe("daily analyses", () => {
  const data = input({
    days: [dayLog(1, 1), dayLog(2, 5), dayLog(3, 2), dayLog(4, 4, 80)],
    symptoms: [symptom(at(1, 12), 8), symptom(at(1, 15), 4), symptom(at(3, 12), 6), symptom(at(4, 12), 2)],
    stress: [stress(at(1, 9), 5), stress(at(2, 9), 1)],
    meals: [meal(at(2, 21, 30))],
  });
  const days = summarizeDays(data, cfg);

  it("summarizes each tracked day", () => {
    expect(days.map((d) => d.date)).toEqual([key(1), key(2), key(3), key(4)]);
    expect(days[0]).toMatchObject({ maxSeverity: 8, meanSeverity: 6, symptomCount: 2, significantCount: 2, maxStress: 5 });
    expect(days[1]).toMatchObject({ maxSeverity: 0, lateMeal: true, sleepQuality: 5 });
    expect(days[3].wearableStress).toBe(80);
  });

  it("compares high-stress days (incl. wearable score) with low-stress days", () => {
    const res = analyzeStressDays(days, cfg);
    expect(res.exposed.dates).toEqual([key(1), key(4)]);
    expect(res.reference.dates).toEqual([key(2), key(3)]);
    expect(res.exposed.mean).toBe(5); // (8 + 2) / 2
    expect(res.reference.mean).toBe(3); // (0 + 6) / 2
    expect(res.difference).toBe(2);
  });

  it("compares poor sleep with good sleep", () => {
    const res = analyzeSleepDays(days, cfg);
    expect(res.exposed.dates).toEqual([key(1), key(3)]);
    expect(res.reference.dates).toEqual([key(2), key(4)]);
    expect(res.difference).toBe(7 - 1);
  });
});

describe("late eating", () => {
  it("looks at complaints the next morning", () => {
    const data = input({
      meals: [meal(at(1, 21, 30)), meal(at(2, 19)), meal(at(3, 22)), meal(at(4, 18)), meal(at(5, 8))],
      symptoms: [symptom(at(2, 8), 5), symptom(at(4, 13), 6)],
    });
    const res = analyzeLateEating(data, cfg);
    // Late evenings: 1st (hit at 8:00 next day), 3rd (13:00 is outside 5–12).
    expect(res.exposed).toEqual({ n: 2, hits: 1, rate: 0.5 });
    // Other evenings with a tracked next day: 2nd, 4th.
    expect(res.reference).toEqual({ n: 2, hits: 0, rate: 0 });
  });

  it("skips evenings without a tracked next day", () => {
    const res = analyzeLateEating(input({ meals: [meal(at(1, 22))] }), cfg);
    expect(res.exposed.n).toBe(0);
    expect(res.difference).toBeNull();
  });
});

describe("summary", () => {
  it("keeps collecting below the minimum number of days", () => {
    const res = runAnalysis(input({ meals: [meal(at(1, 8))] }));
    expect(res.summary.status).toBe("collecting");
    expect(res.summary.progress).toBeCloseTo(1 / 14);
    expect(res.summary.factors).toEqual([]);
    expect(res.summary.confidence).toBe("low");
  });

  it("says unclear when nothing stands out", () => {
    const meals = Array.from({ length: 20 }, (_, i) => meal(at(i + 1, 12), i % 2 ? ["spicy"] : []));
    const res = runAnalysis(input({ meals }));
    expect(res.summary.status).toBe("unclear");
    expect(res.summary.daysTracked).toBe(20);
  });

  it("names food when a tag clearly stands out", () => {
    const meals = Array.from({ length: 20 }, (_, i) => meal(at(i + 1, 12), i % 4 === 0 ? ["onion-garlic"] : []));
    const symptoms = meals.filter((m) => m.tags.length).map((m) => symptom(m.timestamp + 4 * 3600_000, 7));
    const res = runAnalysis(input({ meals, symptoms }));
    expect(res.summary.status).toBe("found");
    expect(res.summary.factors[0]).toBe("food");
    expect(res.summary.topFoodTags).toEqual(["onion-garlic"]);
  });

  it("recovers the story in the seed data (food and stress, not sleep)", () => {
    const seed = generateSeed({ endDate: "2026-03-21", days: 21, seed: 42 });
    const res = runAnalysis(seed);
    expect(res.summary.daysTracked).toBe(21);
    expect(res.summary.status).toBe("found");
    expect(res.summary.factors).toContain("food");
    expect(res.summary.topFoodTags[0]).toBe("onion-garlic");
    expect(res.summary.scores.stress).toBeGreaterThan(res.summary.scores.sleep);
    expect(res.stress.all.difference!).toBeGreaterThan(0.2);
    expect(res.summary.confidence).not.toBe("low");
  });

  it("shrinks small samples so a rare tag can't outrank a frequent one on luck", () => {
    expect(shrink(0.8, 3, cfg)).toBeCloseTo(0.3);
    expect(shrink(0.6, 15, cfg)).toBeCloseTo(0.45);
  });

  it("names two factors together when they are close", () => {
    const meals = Array.from({ length: 20 }, (_, i) => meal(at(i + 1, 12), i % 2 === 0 ? ["onion-garlic"] : []));
    const symptoms = meals.filter((m) => m.tags.length).map((m) => symptom(m.timestamp + 4 * 3600_000, 7));
    // Stress on the odd days, each followed by a complaint 1 h later.
    const stressEvents = meals.filter((m) => !m.tags.length).map((m) => stress(m.timestamp - 2 * 3600_000, 5));
    symptoms.push(...stressEvents.map((s) => symptom(s.timestamp + 3600_000, 6)));
    const res = runAnalysis(input({ meals, symptoms, stress: stressEvents }));
    expect(res.summary.factors.sort()).toEqual(["food", "stress"]);
  });

  it("is deterministic", () => {
    const a = generateSeed({ endDate: "2026-03-21", seed: 7 });
    const b = generateSeed({ endDate: "2026-03-21", seed: 7 });
    expect(runAnalysis(a)).toEqual(runAnalysis(b));
  });
});
