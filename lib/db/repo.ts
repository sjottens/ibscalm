import { newId } from "@/lib/id";
import { addDays, dayKey, parseDayKey } from "@/lib/analysis/time";
import type { AnalysisInput } from "@/lib/analysis/input";
import type { DeepPartial, AnalysisConfig } from "@/lib/analysis/config";
import { getDb } from "./database";
import {
  BUILTIN_FOOD_TAGS,
  type BaseRecord,
  type DayLog,
  type Entry,
  type EntryKind,
  type Meal,
  type StressEvent,
  type Symptom,
  type Tag,
} from "./types";

type Draft<T extends BaseRecord> = Omit<T, keyof BaseRecord> & { id?: string };

function stamp<T extends BaseRecord>(draft: Draft<T>, existing?: T): T {
  const now = Date.now();
  return {
    ...(existing ?? {}),
    ...draft,
    id: draft.id ?? existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  } as T;
}

const tableFor = (kind: EntryKind) => {
  const db = getDb();
  return kind === "meal" ? db.meals : kind === "symptom" ? db.symptoms : db.stress;
};

export async function saveMeal(draft: Draft<Meal>): Promise<Meal> {
  const db = getDb();
  const existing = draft.id ? await db.meals.get(draft.id) : undefined;
  const record = stamp<Meal>(draft, existing);
  await db.meals.put(record);
  return record;
}

export async function saveSymptom(draft: Draft<Symptom>): Promise<Symptom> {
  const db = getDb();
  const existing = draft.id ? await db.symptoms.get(draft.id) : undefined;
  const record = stamp<Symptom>(draft, existing);
  await db.symptoms.put(record);
  return record;
}

export async function saveStress(draft: Draft<StressEvent>): Promise<StressEvent> {
  const db = getDb();
  const existing = draft.id ? await db.stress.get(draft.id) : undefined;
  const record = stamp<StressEvent>(draft, existing);
  await db.stress.put(record);
  return record;
}

/** Soft delete, so it can be undone and (later) synced. */
export async function deleteEntry(kind: EntryKind, id: string): Promise<void> {
  const now = Date.now();
  await tableFor(kind).update(id, { deletedAt: now, updatedAt: now });
}

export async function restoreEntry(kind: EntryKind, id: string): Promise<void> {
  await tableFor(kind).update(id, { deletedAt: null, updatedAt: Date.now() });
}

const alive = <T extends { deletedAt: number | null }>(x: T) => x.deletedAt == null;

/** Every entry of a local calendar day, chronological. */
export async function getEntriesForDay(date: string): Promise<Entry[]> {
  const from = parseDayKey(date).getTime();
  const to = parseDayKey(addDays(date, 1)).getTime() - 1;
  return getEntriesBetween(from, to);
}

export async function getEntriesBetween(from: number, to: number): Promise<Entry[]> {
  const db = getDb();
  const [meals, symptoms, stress] = await Promise.all([
    db.meals.where("timestamp").between(from, to, true, true).filter(alive).toArray(),
    db.symptoms.where("timestamp").between(from, to, true, true).filter(alive).toArray(),
    db.stress.where("timestamp").between(from, to, true, true).filter(alive).toArray(),
  ]);
  const entries: Entry[] = [
    ...meals.map((m) => ({ kind: "meal" as const, ...m })),
    ...symptoms.map((s) => ({ kind: "symptom" as const, ...s })),
    ...stress.map((s) => ({ kind: "stress" as const, ...s })),
  ];
  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

export async function getAllForAnalysis(): Promise<AnalysisInput> {
  const db = getDb();
  const [meals, symptoms, stress, days] = await Promise.all([
    db.meals.filter(alive).toArray(),
    db.symptoms.filter(alive).toArray(),
    db.stress.filter(alive).toArray(),
    db.days.filter(alive).toArray(),
  ]);
  return { meals, symptoms, stress, days };
}

export async function countEntries(): Promise<number> {
  const db = getDb();
  const [a, b, c] = await Promise.all([
    db.meals.filter(alive).count(),
    db.symptoms.filter(alive).count(),
    db.stress.filter(alive).count(),
  ]);
  return a + b + c;
}

export async function getFirstEntryTime(): Promise<number | null> {
  const db = getDb();
  const firsts = await Promise.all([
    db.meals.orderBy("timestamp").first(),
    db.symptoms.orderBy("timestamp").first(),
    db.stress.orderBy("timestamp").first(),
  ]);
  const times = firsts.filter(Boolean).map((x) => x!.timestamp);
  return times.length ? Math.min(...times) : null;
}

/** Recently used meal descriptions with their tags, newest first, de-duplicated. */
export async function getRecentMeals(limit = 6): Promise<Pick<Meal, "description" | "tags" | "size">[]> {
  const db = getDb();
  const recent = await db.meals.orderBy("timestamp").reverse().filter(alive).limit(60).toArray();
  const seen = new Set<string>();
  const out: Pick<Meal, "description" | "tags" | "size">[] = [];
  for (const m of recent) {
    const k = m.description.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ description: m.description, tags: m.tags, size: m.size });
    if (out.length >= limit) break;
  }
  return out;
}

// ── Day logs ──────────────────────────────────────────────────────────────

export async function getDayLog(date: string): Promise<DayLog | undefined> {
  const log = await getDb().days.get(date);
  return log && log.deletedAt == null ? log : undefined;
}

export async function saveDayLog(date: string, patch: Partial<Omit<DayLog, "date">>): Promise<DayLog> {
  const db = getDb();
  const existing = await db.days.get(date);
  const now = Date.now();
  const record: DayLog = {
    ...(existing ?? { date, createdAt: now }),
    ...patch,
    date,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  } as DayLog;
  await db.days.put(record);
  return record;
}

// ── Tags ──────────────────────────────────────────────────────────────────

/** Makes sure every built-in tag exists (idempotent, safe on every start). */
export async function ensureBuiltinTags(): Promise<void> {
  const db = getDb();
  const existing = new Set((await db.tags.toArray()).map((t) => t.id));
  const now = Date.now();
  const missing: Tag[] = BUILTIN_FOOD_TAGS.filter((id) => !existing.has(id)).map((id) => ({
    id,
    label: id,
    kind: "food",
    builtin: true,
    archived: false,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
  if (missing.length) await db.tags.bulkPut(missing);
}

export async function addTag(label: string): Promise<Tag> {
  const now = Date.now();
  const tag: Tag = {
    id: `user-${newId()}`,
    label: label.trim(),
    kind: "food",
    builtin: false,
    archived: false,
    favorite: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await getDb().tags.put(tag);
  return tag;
}

export async function updateTag(id: string, patch: Partial<Pick<Tag, "label" | "archived" | "favorite">>) {
  await getDb().tags.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteTag(id: string) {
  const now = Date.now();
  await getDb().tags.update(id, { deletedAt: now, updatedAt: now });
}

export async function setFavoriteTags(ids: string[]) {
  const db = getDb();
  const set = new Set(ids);
  const now = Date.now();
  await db.transaction("rw", db.tags, async () => {
    for (const tag of await db.tags.toArray()) {
      const favorite = set.has(tag.id);
      if (tag.favorite !== favorite) await db.tags.update(tag.id, { favorite, updatedAt: now });
    }
  });
}

// ── Settings (meta table) ─────────────────────────────────────────────────

export type ThemePreference = "system" | "light" | "dark";

export interface Purchase {
  /** Payment reference from the payment provider (e.g. Mollie tr_…). */
  paymentId: string;
  paidAt: number;
}

export interface Settings {
  onboardingDone: boolean;
  /** One-time purchases unlocked on this device. Included in backups. */
  purchases: { doctorReport?: Purchase };
  /** A payment that was started but not yet confirmed (set before redirecting to iDEAL). */
  pendingPayment: { id: string; startedAt: number } | null;
  theme: ThemePreference;
  lastBackupAt: number | null;
  backupSnoozedUntil: number | null;
  analysis: DeepPartial<AnalysisConfig> | null;
}

export const DEFAULT_SETTINGS: Settings = {
  onboardingDone: false,
  purchases: {},
  pendingPayment: null,
  theme: "system",
  lastBackupAt: null,
  backupSnoozedUntil: null,
  analysis: null,
};

export async function getSettings(): Promise<Settings> {
  const row = await getDb().meta.get("settings");
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await getDb().meta.put({ key: "settings", value: next });
  return next;
}

/** Removes everything on this device. */
export async function wipeAll(): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [db.meals, db.symptoms, db.stress, db.days, db.tags, db.meta], async () => {
    await Promise.all([db.meals.clear(), db.symptoms.clear(), db.stress.clear(), db.days.clear(), db.tags.clear(), db.meta.clear()]);
  });
}

export const today = () => dayKey(Date.now());
