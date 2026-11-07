"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getDb } from "@/lib/db/database";
import {
  countEntries,
  getAllForAnalysis,
  getDayLog,
  getEntriesForDay,
  getFirstEntryTime,
  getRecentMeals,
  getSettings,
} from "@/lib/db/repo";
import { BUILTIN_FOOD_TAGS, type Tag } from "@/lib/db/types";
import { dayKey } from "@/lib/analysis/time";
import { resolveConfig, runAnalysis, trackedDays } from "@/lib/analysis";

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. Use before reading the clock or IndexedDB. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 30_000);
  const onVisible = () => document.visibilityState === "visible" && cb();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/** Today's local date key; updates after midnight and when the app comes back to the foreground. */
export function useToday(): string {
  return useSyncExternalStore(
    subscribeMinute,
    () => dayKey(Date.now()),
    () => "",
  );
}

/** Current time rounded to the minute; re-renders every 30 s and on foreground. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => 0,
  );
}

export const useEntriesForDay = (date: string) => useLiveQuery(() => (date ? getEntriesForDay(date) : []), [date]);

export const useDayLog = (date: string) => useLiveQuery(async () => (date ? ((await getDayLog(date)) ?? null) : null), [date]);

export const useSettings = () => useLiveQuery(getSettings, []);

export const useRecentMeals = () => useLiveQuery(() => getRecentMeals(6), []);

export const useEntryCount = () => useLiveQuery(countEntries, []);

export const useFirstEntryTime = () => useLiveQuery(getFirstEntryTime, []);

/** All non-deleted tags; favourites first, then built-in order, then user tags A–Z. */
export function useTags(): Tag[] | undefined {
  return useLiveQuery(async () => {
    const tags = (await getDb().tags.toArray()).filter((t) => t.deletedAt == null);
    const order = new Map<string, number>(BUILTIN_FOOD_TAGS.map((id, i) => [id, i]));
    return tags.sort(
      (a, b) =>
        Number(b.favorite) - Number(a.favorite) ||
        (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99) ||
        a.label.localeCompare(b.label),
    );
  }, []);
}

/** Returns a function that turns a tag id into its display label. */
export function useTagLabel() {
  const t = useTranslations("tags");
  const tags = useTags();
  return useCallback(
    (id: string) => {
      if ((BUILTIN_FOOD_TAGS as readonly string[]).includes(id)) return t(id as never);
      return tags?.find((x) => x.id === id)?.label ?? id;
    },
    [t, tags],
  );
}

export function useAnalysis() {
  const input = useLiveQuery(getAllForAnalysis, []);
  const settings = useSettings();
  return useMemo(() => {
    if (!input || !settings) return undefined;
    const config = resolveConfig(settings.analysis);
    return { config, result: runAnalysis(input, config), input };
  }, [input, settings]);
}

export function useTrackedDays(): string[] | undefined {
  const input = useLiveQuery(getAllForAnalysis, []);
  return useMemo(() => (input ? trackedDays(input) : undefined), [input]);
}
