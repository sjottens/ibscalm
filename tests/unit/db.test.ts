import { beforeEach, describe, expect, it } from "vitest";
import { AppDatabase, setDbForTests } from "@/lib/db/database";
import {
  addTag,
  deleteEntry,
  ensureBuiltinTags,
  getAllForAnalysis,
  getEntriesForDay,
  getRecentMeals,
  getSettings,
  restoreEntry,
  saveDayLog,
  saveMeal,
  saveStress,
  saveSymptom,
  setFavoriteTags,
  updateSettings,
  wipeAll,
} from "@/lib/db/repo";
import { applyImport, buildExport, csvField, ImportError, parseExport, toCsv } from "@/lib/export";
import { migrateExport } from "@/lib/export/migrations";
import { BUILTIN_FOOD_TAGS } from "@/lib/db/types";
import { at, key } from "./fixtures";

let dbCounter = 0;
beforeEach(() => {
  setDbForTests(new AppDatabase(`test-${++dbCounter}`));
});

describe("repository", () => {
  it("saves, edits and lists entries per day", async () => {
    const m = await saveMeal({ timestamp: at(1, 12), description: "Pasta", tags: ["wheat-gluten"], size: "normal" });
    await saveSymptom({ timestamp: at(1, 15), types: ["bloating"], severity: 5 });
    await saveStress({ timestamp: at(1, 9), level: 3, trigger: "meeting", anticipatory: false });
    await saveMeal({ timestamp: at(2, 12), description: "Rijst", tags: [], size: "small" });

    const day = await getEntriesForDay(key(1));
    expect(day.map((e) => e.kind)).toEqual(["stress", "meal", "symptom"]);

    const edited = await saveMeal({ ...m, description: "Pasta pesto" });
    expect(edited.id).toBe(m.id);
    expect(edited.createdAt).toBe(m.createdAt);
    expect(edited.updatedAt).toBeGreaterThanOrEqual(m.updatedAt);
    expect((await getEntriesForDay(key(1))).find((e) => e.kind === "meal")!.kind === "meal").toBe(true);
  });

  it("soft-deletes and restores", async () => {
    const s = await saveSymptom({ timestamp: at(1, 15), types: ["gas"], severity: 3 });
    await deleteEntry("symptom", s.id);
    expect(await getEntriesForDay(key(1))).toHaveLength(0);
    expect((await getAllForAnalysis()).symptoms).toHaveLength(0);
    await restoreEntry("symptom", s.id);
    expect(await getEntriesForDay(key(1))).toHaveLength(1);
  });

  it("upserts day logs", async () => {
    await saveDayLog(key(1), { sleepQuality: 2 });
    const log = await saveDayLog(key(1), { water: 6 });
    expect(log).toMatchObject({ date: key(1), sleepQuality: 2, water: 6 });
  });

  it("suggests recent meals without duplicates", async () => {
    await saveMeal({ timestamp: at(1, 8), description: "Havermout", tags: [], size: "normal" });
    await saveMeal({ timestamp: at(2, 8), description: "havermout ", tags: [], size: "normal" });
    await saveMeal({ timestamp: at(2, 12), description: "Soep", tags: ["legumes"], size: "normal" });
    const recent = await getRecentMeals();
    expect(recent.map((r) => r.description)).toEqual(["Soep", "havermout "]);
  });

  it("creates built-in tags once and manages user tags", async () => {
    await ensureBuiltinTags();
    await ensureBuiltinTags();
    const t = await addTag("  Avocado ");
    expect(t.label).toBe("Avocado");
    await setFavoriteTags(["onion-garlic", t.id]);
    const exported = await buildExport();
    expect(exported.data.tags).toHaveLength(BUILTIN_FOOD_TAGS.length + 1);
    expect(exported.data.tags.filter((x) => x.favorite).map((x) => x.id).sort()).toEqual(["onion-garlic", t.id].sort());
  });

  it("stores settings with defaults", async () => {
    expect((await getSettings()).theme).toBe("system");
    await updateSettings({ onboardingDone: true });
    expect(await getSettings()).toMatchObject({ onboardingDone: true, theme: "system" });
  });

  it("wipes everything", async () => {
    await saveMeal({ timestamp: at(1, 8), description: "x", tags: [], size: "normal" });
    await updateSettings({ onboardingDone: true });
    await wipeAll();
    expect((await getAllForAnalysis()).meals).toHaveLength(0);
    expect((await getSettings()).onboardingDone).toBe(false);
  });
});

describe("export and import", () => {
  it("round-trips through JSON", async () => {
    await saveMeal({ timestamp: at(1, 12), description: "Curry", tags: ["onion-garlic"], size: "large", note: "lekker" });
    await saveSymptom({ timestamp: at(1, 16), types: ["pain", "cramps"], severity: 7, bristol: 6 });
    await saveStress({ timestamp: at(1, 9), level: 4, trigger: "deadline", anticipatory: true });
    await saveDayLog(key(1), { sleepQuality: 3, wearable: { hrv: 45 } });
    const text = JSON.stringify(await buildExport());

    setDbForTests(new AppDatabase("import-target"));
    const res = await applyImport(parseExport(text));
    expect(res).toEqual({ added: 4, updated: 0, skipped: 0 });
    const all = await getAllForAnalysis();
    expect(all.meals[0]).toMatchObject({ description: "Curry", note: "lekker", size: "large" });
    expect(all.symptoms[0]).toMatchObject({ severity: 7, bristol: 6 });
    expect(all.days[0].wearable).toEqual({ hrv: 45 });

    // Importing the same file again changes nothing.
    expect(await applyImport(parseExport(text))).toEqual({ added: 0, updated: 0, skipped: 4 });
  });

  it("keeps the newer version when merging", async () => {
    const m = await saveMeal({ timestamp: at(1, 12), description: "Oud", tags: [], size: "normal" });
    const file = await buildExport();
    file.data.meals[0] = { ...file.data.meals[0], description: "Nieuw", updatedAt: m.updatedAt + 1000 };
    expect(await applyImport(file)).toMatchObject({ updated: 1 });
    expect((await getAllForAnalysis()).meals[0].description).toBe("Nieuw");
  });

  it("replaces when asked", async () => {
    await saveMeal({ timestamp: at(1, 12), description: "Weg", tags: [], size: "normal" });
    const empty = await buildExport();
    empty.data.meals = [];
    await applyImport(empty, "replace");
    expect((await getAllForAnalysis()).meals).toHaveLength(0);
  });

  it("rejects invalid files with a clear code", () => {
    const code = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return (e as ImportError).code;
      }
    };
    expect(code(() => parseExport("{nope"))).toBe("invalid-json");
    expect(code(() => parseExport(JSON.stringify({ app: "other" })))).toBe("not-ours");
    expect(code(() => parseExport(JSON.stringify({ app: "pds-tracker", format: 99 })))).toBe("too-new");
    const bad = { app: "pds-tracker", format: 1, exportedAt: 0, schemaVersion: 1, data: { symptoms: [{ id: "x", severity: 99 }] } };
    expect(code(() => parseExport(JSON.stringify(bad)))).toBe("invalid-data");
  });

  it("leaves current-format files untouched in migration", () => {
    const f = { app: "pds-tracker", format: 1 };
    expect(migrateExport(f)).toBe(f);
  });

  it("writes a chronological CSV and escapes safely", async () => {
    await saveMeal({ timestamp: at(1, 12), description: 'Soep, "zelfgemaakt"', tags: ["legumes"], size: "normal" });
    await saveSymptom({ timestamp: at(1, 15), types: ["gas"], severity: 4 });
    await saveDayLog(key(1), { sleepQuality: 4 });
    const csv = toCsv(await buildExport(), (id) => (id === "legumes" ? "peulvruchten" : id));
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines[0].startsWith("type,date,time")).toBe(true);
    expect(lines[1].startsWith("day,2026-03-01")).toBe(true);
    expect(lines[2]).toContain('"Soep, ""zelfgemaakt"""');
    expect(lines[2]).toContain("peulvruchten");
    expect(lines[3].startsWith("symptom,2026-03-01,15:00")).toBe(true);
    expect(csvField("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
  });
});
