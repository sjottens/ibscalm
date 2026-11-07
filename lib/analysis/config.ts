/** All time windows and thresholds used by the analysis. Users can tweak these in settings. */
export interface AnalysisConfig {
  /** A symptom counts as "a complaint" from this severity (0–10). */
  severityThreshold: number;
  food: {
    /** Symptom window after a meal, in hours. */
    minHours: number;
    maxHours: number;
    /** Minimum meals with (and without) a tag before it can drive the summary. */
    minMeals: number;
  };
  stress: {
    /** Window around a stress moment in which a symptom counts, in hours. */
    beforeHours: number;
    afterHours: number;
    /** Day-level grouping on the 1–5 scale. */
    highLevel: number;
    lowLevel: number;
    /** Wearable stress score (0–100) from which a day counts as high-stress. */
    wearableHighScore: number;
    /** Hourly reference moments are sampled between these local hours. */
    referenceStartHour: number;
    referenceEndHour: number;
  };
  sleep: {
    /** 1–5 */
    goodQuality: number;
    poorQuality: number;
  };
  lateEating: {
    /** A meal from this local hour counts as "late". */
    hour: number;
    morningStartHour: number;
    morningEndHour: number;
  };
  summary: {
    /** Below this many tracked days the summary keeps collecting. */
    minDays: number;
    /** Minimum effect (difference in probability, 0–1) to name a factor. */
    minEffect: number;
    /** Factors scoring at least this share of the strongest are named together. */
    tieRatio: number;
    /**
     * Small samples are shrunk towards zero: score × n / (n + shrinkage),
     * so a tag seen 3 times can't outrank one seen 15 times on luck alone.
     */
    shrinkage: number;
    /** Minimum group size for a comparison to count. */
    minGroup: number;
  };
  /** Data-point thresholds for the reliability label. */
  confidence: {
    medium: number;
    high: number;
  };
}

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  severityThreshold: 4,
  // The brief suggested 2–24 h. With near-daily complaints, almost every meal then has a complaint
  // within 24 h (83% in the seed data), which hides real triggers. 2–8 h separates them clearly;
  // users can widen it to 24 h in settings.
  food: { minHours: 2, maxHours: 8, minMeals: 3 },
  stress: {
    beforeHours: 0,
    afterHours: 3,
    highLevel: 4,
    lowLevel: 2,
    wearableHighScore: 60,
    referenceStartHour: 8,
    referenceEndHour: 22,
  },
  sleep: { goodQuality: 4, poorQuality: 2 },
  lateEating: { hour: 21, morningStartHour: 5, morningEndHour: 12 },
  summary: { minDays: 14, minEffect: 0.12, tieRatio: 0.75, minGroup: 3, shrinkage: 5 },
  confidence: { medium: 8, high: 20 },
};

/** Deep-merges a partial config (e.g. stored user overrides) over the defaults. */
export function resolveConfig(partial?: DeepPartial<AnalysisConfig> | null): AnalysisConfig {
  const base = DEFAULT_ANALYSIS_CONFIG;
  if (!partial) return base;
  return {
    severityThreshold: partial.severityThreshold ?? base.severityThreshold,
    food: { ...base.food, ...partial.food },
    stress: { ...base.stress, ...partial.stress },
    sleep: { ...base.sleep, ...partial.sleep },
    lateEating: { ...base.lateEating, ...partial.lateEating },
    summary: { ...base.summary, ...partial.summary },
    confidence: { ...base.confidence, ...partial.confidence },
  };
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
