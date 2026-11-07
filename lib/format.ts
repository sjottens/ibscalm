import { parseDayKey } from "@/lib/analysis/time";

/** All formatting uses the device's own time zone (data is stored as local moments). */

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = locale + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", options);
    cache.set(key, f);
  }
  return f;
}

export function formatTime(ts: number, locale: string): string {
  return fmt(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(ts);
}

/** "za 7 nov" / "Sat 7 Nov" */
export function formatDayShort(date: string, locale: string): string {
  return fmt(locale, { weekday: "short", day: "numeric", month: "short" }).format(parseDayKey(date)).replace(".", "");
}

/** "zaterdag 7 november" */
export function formatDayLong(date: string, locale: string): string {
  return fmt(locale, { weekday: "long", day: "numeric", month: "long" }).format(parseDayKey(date));
}

export function formatWeekdayNarrow(date: string, locale: string): string {
  return fmt(locale, { weekday: "short" }).format(parseDayKey(date)).replace(".", "").slice(0, 2);
}

export function formatDateNumeric(ts: number, locale: string): string {
  return fmt(locale, { day: "numeric", month: "short", year: "numeric" }).format(ts);
}

/** ISO week number, for the masthead. */
export function isoWeek(date: string): number {
  const d = parseDayKey(date);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

export function percent(x: number | null): string {
  return x === null ? "–" : `${Math.round(x * 100)}%`;
}

/** "HH:mm" for <input type="time"> */
export function toTimeInput(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
