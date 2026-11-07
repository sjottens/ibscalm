import { DERIVED_TAGS, type Meal } from "@/lib/db/types";
import type { AnalysisConfig } from "./config";
import { clean, significantTimes, type AnalysisInput } from "./input";
import { anyInRange, compareRates, rate, type Rate, type RateComparison } from "./stats";
import { HOUR, localHour } from "./time";

/** Tags of a meal including the ones derived from size and time. */
export function effectiveTags(meal: Meal, cfg: AnalysisConfig): string[] {
  const tags = new Set(meal.tags);
  if (meal.size === "large") tags.add(DERIVED_TAGS.large);
  if (localHour(meal.timestamp) >= cfg.lateEating.hour) tags.add(DERIVED_TAGS.late);
  return [...tags];
}

/** Was the meal followed by a complaint within the configured window? */
export function isFollowedBySymptom(meal: Meal, significant: number[], cfg: AnalysisConfig): boolean {
  return anyInRange(
    significant,
    meal.timestamp + cfg.food.minHours * HOUR,
    meal.timestamp + cfg.food.maxHours * HOUR,
  );
}

export interface TagEffect extends RateComparison {
  tag: string;
}

export interface FoodAnalysis {
  totalMeals: number;
  /** Share of all meals followed by a complaint. */
  baseline: Rate;
  /** One entry per tag that occurs at least once, strongest positive difference first. */
  tags: TagEffect[];
}

/**
 * Per food tag: the share of meals followed by a complaint (severity ≥ threshold)
 * within minHours–maxHours, compared with meals without that tag.
 */
export function analyzeFood(raw: AnalysisInput, cfg: AnalysisConfig): FoodAnalysis {
  const input = clean(raw);
  const significant = significantTimes(input.symptoms, cfg);
  const meals = input.meals.map((m) => ({
    tags: new Set(effectiveTags(m, cfg)),
    followed: isFollowedBySymptom(m, significant, cfg),
  }));

  const allTags = new Set<string>();
  for (const m of meals) for (const t of m.tags) allTags.add(t);

  const totalFollowed = meals.filter((m) => m.followed).length;
  const tags: TagEffect[] = [...allTags].map((tag) => {
    let n = 0;
    let hits = 0;
    for (const m of meals) {
      if (m.tags.has(tag)) {
        n++;
        if (m.followed) hits++;
      }
    }
    const exposed = rate(hits, n);
    const reference = rate(totalFollowed - hits, meals.length - n);
    return { tag, ...compareRates(exposed, reference, cfg) };
  });

  tags.sort(
    (a, b) =>
      (b.difference ?? -Infinity) - (a.difference ?? -Infinity) ||
      b.exposed.n - a.exposed.n ||
      a.tag.localeCompare(b.tag),
  );

  return { totalMeals: meals.length, baseline: rate(totalFollowed, meals.length), tags };
}
