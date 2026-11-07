import Dexie, { type EntityTable } from "dexie";
import type { DayLog, Meal, StressEvent, Symptom, Tag } from "./types";

export interface MetaRow {
  key: string;
  value: unknown;
}

/** Current schema version. Bump together with a new `db.version(n)` block below. */
export const SCHEMA_VERSION = 1;
export const DB_NAME = "pds-tracker";

export class AppDatabase extends Dexie {
  meals!: EntityTable<Meal, "id">;
  symptoms!: EntityTable<Symptom, "id">;
  stress!: EntityTable<StressEvent, "id">;
  days!: EntityTable<DayLog, "date">;
  tags!: EntityTable<Tag, "id">;
  meta!: EntityTable<MetaRow, "key">;

  constructor(name = DB_NAME) {
    super(name);
    // v1 — initial schema. Indexes: timestamp for range queries, updatedAt for a future sync.
    this.version(1).stores({
      meals: "id, timestamp, updatedAt, *tags",
      symptoms: "id, timestamp, updatedAt",
      stress: "id, timestamp, updatedAt",
      days: "date, updatedAt",
      tags: "id, kind, updatedAt",
      meta: "key",
    });
    // Future migrations go here, e.g.:
    // this.version(2).stores({ ... }).upgrade(async (tx) => { ... });
  }
}

let instance: AppDatabase | null = null;

/** Lazily opened database (never on the server). */
export function getDb(): AppDatabase {
  if (!instance) instance = new AppDatabase();
  return instance;
}

/** Test hook: use a fresh, isolated database. */
export function setDbForTests(db: AppDatabase | null) {
  instance = db;
}
