/**
 * Deterministic fictional data for development and tests — never shipped to users' devices
 * unless they explicitly load it from the dev-only button.
 *
 * The story baked in (so you can check the insights page recovers it):
 * - onion/garlic is a strong trigger (complaint 3–7 h later, most of the time)
 * - dairy is a weak trigger
 * - high stress (≥ 4) and anticipatory stress often bring complaints within ~2.5 h
 * - late dinners sometimes lead to complaints the next morning
 * - sleep has only a small effect
 */
import type { DayLog, Meal, MealSize, StressEvent, StressTrigger, Symptom, SymptomType } from "@/lib/db/types";
import { addDays, atHour, dayKey, HOUR } from "@/lib/analysis/time";

export interface SeedData {
  meals: Meal[];
  symptoms: Symptom[];
  stress: StressEvent[];
  days: DayLog[];
}

/** Small, fast, seedable PRNG. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MenuItem {
  nl: string;
  tags: string[];
}

const BREAKFAST: MenuItem[] = [
  { nl: "Havermout met yoghurt", tags: ["dairy-lactose"] },
  { nl: "Volkorenbrood met kaas", tags: ["wheat-gluten", "dairy-lactose"] },
  { nl: "Glutenvrij brood met pindakaas", tags: [] },
  { nl: "Roerei met spinazie", tags: [] },
  { nl: "Kwark met blauwe bessen", tags: ["dairy-lactose"] },
  { nl: "Rijstwafels met banaan", tags: [] },
];
const LUNCH: MenuItem[] = [
  { nl: "Broodje kip", tags: ["wheat-gluten"] },
  { nl: "Linzensoep", tags: ["legumes", "onion-garlic"] },
  { nl: "Salade met tonijn", tags: [] },
  { nl: "Wrap hummus en paprika", tags: ["wheat-gluten", "legumes", "onion-garlic"] },
  { nl: "Tosti ham-kaas", tags: ["wheat-gluten", "dairy-lactose"] },
  { nl: "Rijstsalade met ei", tags: [] },
  { nl: "Kroket op brood", tags: ["wheat-gluten", "fatty-fried"] },
];
const DINNER: MenuItem[] = [
  { nl: "Pasta pesto met knoflook", tags: ["wheat-gluten", "onion-garlic"] },
  { nl: "Rode curry met ui", tags: ["onion-garlic", "spicy"] },
  { nl: "Zalm met aardappels en sperziebonen", tags: [] },
  { nl: "Rijst met kip en courgette", tags: [] },
  { nl: "Chili con carne", tags: ["onion-garlic", "legumes", "spicy"] },
  { nl: "Patat met frikandel", tags: ["fatty-fried"] },
  { nl: "Ovenschotel met kaas", tags: ["dairy-lactose"] },
  { nl: "Quinoa met geroosterde groenten", tags: [] },
];
const SNACKS: MenuItem[] = [
  { nl: "Appel", tags: ["stone-fruit"] },
  { nl: "Cola", tags: ["carbonated", "sugar-candy"] },
  { nl: "Kauwgom (suikervrij)", tags: ["sweeteners"] },
  { nl: "Handje noten", tags: [] },
  { nl: "Stroopwafel", tags: ["sugar-candy", "wheat-gluten"] },
];

const TRIGGERS: StressTrigger[] = ["meeting", "deadline", "social", "home", "travel", "other"];

export function generateSeed({ endDate = dayKey(Date.now()), days = 21, seed = 42 } = {}): SeedData {
  const rnd = mulberry32(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const int = (a: number, b: number) => Math.floor(between(a, b + 1));
  const chance = (p: number) => rnd() < p;

  const meals: Meal[] = [];
  const symptoms: Symptom[] = [];
  const stress: StressEvent[] = [];
  const dayLogs: DayLog[] = [];
  let counter = 0;
  const id = (p: string) => `seed-${p}-${String(++counter).padStart(4, "0")}`;
  const now = Date.now();
  const base = (ts: number) => ({ createdAt: ts, updatedAt: ts, deletedAt: null });
  const minuteRound = (ts: number) => Math.round(ts / 60000) * 60000;

  const addSymptom = (ts: number, severity: number, types: SymptomType[], note?: string) => {
    const t = minuteRound(ts);
    if (t > now) return;
    symptoms.push({
      id: id("sym"),
      timestamp: t,
      types,
      severity: Math.max(0, Math.min(10, Math.round(severity))),
      bristol: chance(0.4) ? pick([3, 4, 5, 6, 6, 7]) : null,
      note,
      ...base(t),
    });
  };

  const addMeal = (ts: number, item: MenuItem, size: MealSize, extraTags: string[] = []) => {
    const t = minuteRound(ts);
    if (t > now) return null;
    const meal: Meal = {
      id: id("meal"),
      timestamp: t,
      description: item.nl,
      tags: [...new Set([...item.tags, ...extraTags])],
      size,
      ...base(t),
    };
    meals.push(meal);
    return meal;
  };

  const start = addDays(endDate, -(days - 1));
  for (let i = 0; i < days; i++) {
    const day = addDays(start, i);
    const weekday = new Date(atHour(day, 12)).getDay(); // 0 = Sunday
    const workday = weekday >= 1 && weekday <= 5;

    // Sleep: the night before this day.
    const sleepQuality = int(1, 5);
    const poorSleep = sleepQuality <= 2;
    const bedtimeH = between(22.5, 24.5);
    const wakeH = workday ? between(6.5, 7.5) : between(7.5, 9.5);
    const fmt = (h: number) => {
      const hh = Math.floor(h) % 24;
      const mm = Math.floor((h % 1) * 60);
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };
    const dayStart = atHour(day, 0);
    dayLogs.push({
      date: day,
      bedtime: fmt(bedtimeH),
      wakeTime: fmt(wakeH),
      sleepQuality,
      wearable: chance(0.6)
        ? {
            stressScore: int(20, workday ? 75 : 50),
            hrv: int(28, 70),
            readiness: poorSleep ? int(35, 60) : int(60, 92),
          }
        : undefined,
      movement: int(10, 75),
      water: int(4, 9),
      ...base(dayStart + 9 * HOUR),
    });

    const severityBoost = poorSleep ? 1 : 0;

    // Meals
    const dayMeals: Meal[] = [];
    const push = (m: Meal | null) => m && dayMeals.push(m);
    push(addMeal(atHour(day, 0) + between(wakeH + 0.3, wakeH + 1.2) * HOUR, pick(BREAKFAST), "normal"));
    push(addMeal(atHour(day, 0) + between(12.2, 13.3) * HOUR, pick(LUNCH), chance(0.2) ? "small" : "normal", chance(0.15) ? ["fast-eating"] : []));
    if (chance(0.55)) push(addMeal(atHour(day, 0) + between(15, 16.5) * HOUR, pick(SNACKS), "small"));
    const lateDinner = chance(0.22);
    const dinnerH = lateDinner ? between(21.1, 22) : between(18, 19.6);
    push(addMeal(atHour(day, 0) + dinnerH * HOUR, pick(DINNER), chance(0.25) ? "large" : "normal"));

    for (const meal of dayMeals) {
      if (meal.tags.includes("onion-garlic") && chance(0.8)) {
        addSymptom(meal.timestamp + between(3, 7) * HOUR, between(5, 8) + severityBoost, ["bloating", pick(["pain", "cramps", "gas"] as SymptomType[])]);
      } else if (meal.tags.includes("dairy-lactose") && chance(0.3)) {
        addSymptom(meal.timestamp + between(2, 5) * HOUR, between(4, 5.5) + severityBoost, ["bloating", "gas"]);
      }
    }
    if (lateDinner && chance(0.5)) {
      addSymptom(atHour(addDays(day, 1), 0) + between(6.5, 10) * HOUR, between(4, 6), ["bloating", "nausea"]);
    }

    // Stress
    const stressCount = workday ? int(1, 2) : chance(0.35) ? 1 : 0;
    for (let s = 0; s < stressCount; s++) {
      const anticipatory = chance(0.25);
      const level = anticipatory ? int(3, 4) : int(2, 5);
      const ts = minuteRound(atHour(day, 0) + between(9, 17.5) * HOUR);
      if (ts > now) continue;
      stress.push({
        id: id("str"),
        timestamp: ts,
        level,
        trigger: anticipatory ? pick(["travel", "social", "meeting"] as StressTrigger[]) : workday ? pick(["meeting", "deadline", "deadline", "other"] as StressTrigger[]) : pick(TRIGGERS),
        anticipatory,
        note: anticipatory ? "Bang dat ik onderweg naar de wc moet" : undefined,
        ...base(ts),
      });
      if ((level >= 4 && chance(0.5)) || (anticipatory && chance(0.6))) {
        addSymptom(ts + between(0.4, 2.5) * HOUR, between(4, 7) + severityBoost, [pick(["cramps", "diarrhea", "pain"] as SymptomType[])]);
      }
    }

    // Background noise: occasional mild complaints.
    if (chance(0.2)) addSymptom(atHour(day, 0) + between(10, 21) * HOUR, between(1, 4) + severityBoost, ["gas"]);
  }

  const byTime = <T extends { timestamp: number }>(a: T, b: T) => a.timestamp - b.timestamp;
  return { meals: meals.sort(byTime), symptoms: symptoms.sort(byTime), stress: stress.sort(byTime), days: dayLogs };
}
