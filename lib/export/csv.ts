import type { ExportFile } from "./format";

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const localTime = (ts: number) => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** RFC 4180 field escaping; also neutralises spreadsheet formula injection. */
export function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_COLUMNS = [
  "type",
  "date",
  "time",
  "description",
  "tags",
  "size",
  "symptom_types",
  "severity",
  "bristol",
  "stress_level",
  "stress_trigger",
  "anticipatory",
  "bedtime",
  "wake_time",
  "sleep_quality",
  "wearable_stress",
  "hrv_ms",
  "readiness",
  "movement_min",
  "water_glasses",
  "note",
] as const;

type Row = Partial<Record<(typeof CSV_COLUMNS)[number], unknown>>;

/**
 * One flat, chronological CSV for spreadsheets or sharing with a dietitian.
 * Deleted records are left out. (Re-importing is done with the JSON export.)
 */
export function toCsv(file: ExportFile, tagLabel: (id: string) => string = (id) => id): string {
  const alive = <T extends { deletedAt: number | null }>(xs: T[]) => xs.filter((x) => x.deletedAt == null);
  const rows: { sort: number; row: Row }[] = [];
  for (const m of alive(file.data.meals)) {
    rows.push({
      sort: m.timestamp,
      row: {
        type: "meal",
        date: localDate(m.timestamp),
        time: localTime(m.timestamp),
        description: m.description,
        tags: m.tags.map(tagLabel).join("|"),
        size: m.size,
        note: m.note,
      },
    });
  }
  for (const s of alive(file.data.symptoms)) {
    rows.push({
      sort: s.timestamp,
      row: {
        type: "symptom",
        date: localDate(s.timestamp),
        time: localTime(s.timestamp),
        symptom_types: s.types.join("|"),
        severity: s.severity,
        bristol: s.bristol,
        note: s.note,
      },
    });
  }
  for (const s of alive(file.data.stress)) {
    rows.push({
      sort: s.timestamp,
      row: {
        type: "stress",
        date: localDate(s.timestamp),
        time: localTime(s.timestamp),
        stress_level: s.level,
        stress_trigger: s.trigger,
        anticipatory: s.anticipatory ? "yes" : "no",
        note: s.note,
      },
    });
  }
  for (const d of alive(file.data.days)) {
    const [y, mo, da] = d.date.split("-").map(Number);
    rows.push({
      // Day rows sort to the start of their day.
      sort: new Date(y, mo - 1, da).getTime() - 1,
      row: {
        type: "day",
        date: d.date,
        bedtime: d.bedtime,
        wake_time: d.wakeTime,
        sleep_quality: d.sleepQuality,
        wearable_stress: d.wearable?.stressScore,
        hrv_ms: d.wearable?.hrv,
        readiness: d.wearable?.readiness,
        movement_min: d.movement,
        water_glasses: d.water,
        note: d.note,
      },
    });
  }
  rows.sort((a, b) => a.sort - b.sort);
  const lines = [CSV_COLUMNS.join(","), ...rows.map(({ row }) => CSV_COLUMNS.map((c) => csvField(row[c])).join(","))];
  // BOM so Excel opens UTF-8 (ë, é) correctly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
