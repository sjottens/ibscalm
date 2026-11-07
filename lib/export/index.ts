import { getDb, SCHEMA_VERSION } from "@/lib/db/database";
import type { DayLog, Meal, StressEvent, Symptom, Tag } from "@/lib/db/types";
import { EXPORT_APP_ID, EXPORT_FORMAT, exportSchema, type ExportFile } from "./format";
import { migrateExport } from "./migrations";

export * from "./csv";
export * from "./format";

/** Snapshot of everything on the device (including tombstones, so a restore stays faithful). */
export async function buildExport(now = Date.now()): Promise<ExportFile> {
  const db = getDb();
  const [meals, symptoms, stress, days, tags] = await Promise.all([
    db.meals.toArray(),
    db.symptoms.toArray(),
    db.stress.toArray(),
    db.days.toArray(),
    db.tags.toArray(),
  ]);
  return {
    app: EXPORT_APP_ID,
    format: EXPORT_FORMAT,
    exportedAt: now,
    schemaVersion: SCHEMA_VERSION,
    data: { meals, symptoms, stress, days, tags } as ExportFile["data"],
  };
}

export class ImportError extends Error {
  constructor(public code: "invalid-json" | "not-ours" | "invalid-data" | "too-new") {
    super(code);
  }
}

/** Parses and validates an export file, migrating older formats. Throws ImportError. */
export function parseExport(text: string): ExportFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError("invalid-json");
  }
  if (!raw || typeof raw !== "object" || (raw as { app?: unknown }).app !== EXPORT_APP_ID) {
    throw new ImportError("not-ours");
  }
  const format = (raw as { format?: unknown }).format;
  if (typeof format === "number" && format > EXPORT_FORMAT) throw new ImportError("too-new");
  const parsed = exportSchema.safeParse(migrateExport(raw as Record<string, unknown>));
  if (!parsed.success) throw new ImportError("invalid-data");
  return parsed.data;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
}

/**
 * Merges an export into the database. Records are matched by id; the newer `updatedAt` wins.
 * With mode "replace" the device is wiped first.
 */
export async function applyImport(file: ExportFile, mode: "merge" | "replace" = "merge"): Promise<ImportResult> {
  const db = getDb();
  const result: ImportResult = { added: 0, updated: 0, skipped: 0 };
  await db.transaction("rw", [db.meals, db.symptoms, db.stress, db.days, db.tags], async () => {
    if (mode === "replace") {
      await Promise.all([db.meals.clear(), db.symptoms.clear(), db.stress.clear(), db.days.clear(), db.tags.clear()]);
    }
    const merge = async <T extends { updatedAt: number }>(
      table: { get(key: string): Promise<T | undefined>; put(item: T): Promise<unknown> },
      items: T[],
      keyOf: (item: T) => string,
    ) => {
      for (const item of items) {
        const existing = await table.get(keyOf(item));
        if (!existing) {
          await table.put(item);
          result.added++;
        } else if (item.updatedAt > existing.updatedAt) {
          await table.put(item);
          result.updated++;
        } else {
          result.skipped++;
        }
      }
    };
    const d = file.data;
    await merge<Meal>(db.meals as never, d.meals as Meal[], (x) => x.id);
    await merge<Symptom>(db.symptoms as never, d.symptoms as Symptom[], (x) => x.id);
    await merge<StressEvent>(db.stress as never, d.stress as StressEvent[], (x) => x.id);
    await merge<DayLog>(db.days as never, d.days as DayLog[], (x) => x.date);
    await merge<Tag>(db.tags as never, d.tags as Tag[], (x) => x.id);
  });
  return result;
}

export function exportFileName(ext: "json" | "csv", now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `pds-dagboek-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.${ext}`;
}

/** Triggers a download of a text file in the browser. */
export function downloadText(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
