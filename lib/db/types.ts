/**
 * Domain model. Every record carries createdAt/updatedAt/deletedAt so a future
 * end-to-end encrypted sync can merge by "last write wins" and propagate deletions.
 * All timestamps are epoch milliseconds; dates are local "YYYY-MM-DD" strings.
 */

export type ID = string;

export interface BaseRecord {
  id: ID;
  createdAt: number;
  updatedAt: number;
  /** Soft delete marker (tombstone) — kept for sync, hidden from the UI. */
  deletedAt: number | null;
}

export type MealSize = "small" | "normal" | "large";

export interface Meal extends BaseRecord {
  timestamp: number;
  description: string;
  /** Food tag ids, see BUILTIN_FOOD_TAGS and user tags. */
  tags: string[];
  size: MealSize;
  note?: string;
}

export const SYMPTOM_TYPES = [
  "pain",
  "bloating",
  "cramps",
  "gas",
  "diarrhea",
  "constipation",
  "nausea",
] as const;
export type SymptomType = (typeof SYMPTOM_TYPES)[number];

export interface Symptom extends BaseRecord {
  timestamp: number;
  types: SymptomType[];
  /** 0–10 */
  severity: number;
  /** Bristol stool scale 1–7, optional. */
  bristol?: number | null;
  note?: string;
}

export const STRESS_TRIGGERS = ["meeting", "deadline", "social", "home", "travel", "other"] as const;
export type StressTrigger = (typeof STRESS_TRIGGERS)[number];

export interface StressEvent extends BaseRecord {
  timestamp: number;
  /** 1–5 */
  level: number;
  trigger: StressTrigger;
  /** Stress beforehand, out of fear for gut symptoms. */
  anticipatory: boolean;
  note?: string;
}

export interface WearableData {
  /** 0–100 */
  stressScore?: number | null;
  /** ms */
  hrv?: number | null;
  /** 0–100 */
  readiness?: number | null;
}

/** One per calendar day. Sleep fields describe the night *before* this date. */
export interface DayLog {
  /** Primary key, local "YYYY-MM-DD". */
  date: string;
  bedtime?: string | null; // "HH:mm"
  wakeTime?: string | null; // "HH:mm"
  /** 1–5 */
  sleepQuality?: number | null;
  wearable?: WearableData;
  /** Minutes of movement. */
  movement?: number | null;
  /** Glasses of water. */
  water?: number | null;
  note?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface Tag extends BaseRecord {
  /** Display label; built-in tags are translated in the UI by id instead. */
  label: string;
  kind: "food";
  builtin: boolean;
  /** Hidden from the quick picker but kept for history. */
  archived: boolean;
  /** Shown first in the picker (chosen during onboarding). */
  favorite: boolean;
}

export type EntryKind = "meal" | "symptom" | "stress";
export type Entry =
  | ({ kind: "meal" } & Meal)
  | ({ kind: "symptom" } & Symptom)
  | ({ kind: "stress" } & StressEvent);

/**
 * Built-in food tags, grouped the way people think about food. Ids are stable (stored in data);
 * labels live in messages/*.json under tags.* and group names under tagGroups.*.
 * The order here is the order in the picker.
 */
export const FOOD_TAG_GROUPS = {
  triggers: ["onion-garlic", "wheat-gluten", "dairy-lactose", "legumes", "sweeteners", "fatty-fried", "spicy"],
  grains: ["bread", "pasta", "rice", "potato", "oats"],
  vegetables: ["vegetables", "cabbage", "bell-pepper", "tomato", "mushrooms", "raw-veg"],
  fruit: ["fruit", "stone-fruit", "banana", "citrus", "berries", "dried-fruit"],
  protein: ["eggs", "beef", "pork", "poultry", "fish", "nuts"],
  drinks: ["coffee", "alcohol", "carbonated"],
  other: ["sugar-candy", "chocolate", "processed", "fast-eating"],
} as const;
export type FoodTagGroup = keyof typeof FOOD_TAG_GROUPS;

export const BUILTIN_FOOD_TAGS = [
  ...Object.values(FOOD_TAG_GROUPS).flat(),
  // Derived automatically from portion size and time (kept for history and analysis).
  "large-meal",
  "late-meal",
] as const;
export type BuiltinFoodTag = (typeof BUILTIN_FOOD_TAGS)[number];

/** Group of a built-in tag; user-made tags have none. */
export function tagGroupOf(id: string): FoodTagGroup | null {
  for (const [group, ids] of Object.entries(FOOD_TAG_GROUPS)) {
    if ((ids as readonly string[]).includes(id)) return group as FoodTagGroup;
  }
  return null;
}

/** Tags the analysis derives automatically (they can also be set by hand). */
export const DERIVED_TAGS = { large: "large-meal", late: "late-meal" } as const;
