export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date "YYYY-MM-DD" for a timestamp. */
export function dayKey(ts: number | Date): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight for a "YYYY-MM-DD" key. */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Adds calendar days (DST-safe). */
export function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Timestamp for a local hour on a given day. */
export function atHour(key: string, hour: number): number {
  const d = parseDayKey(key);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

export function localHour(ts: number): number {
  const d = new Date(ts);
  return d.getHours() + d.getMinutes() / 60;
}

/** Number of calendar days between two keys (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / DAY);
}
