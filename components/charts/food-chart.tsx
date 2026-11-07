"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { shrink, type AnalysisConfig, type TagEffect } from "@/lib/analysis";
import { percent } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * One row per food tag: the bar is the share of meals *with* the tag followed by a complaint,
 * the ink tick marks the share *without* it. Few meals → halftone bar + "few" label,
 * so uncertain rows look uncertain.
 */
export function FoodChart({ tags, config, tagLabel }: { tags: TagEffect[]; config: AnalysisConfig; tagLabel: (id: string) => string }) {
  const t = useTranslations("insights.food");
  const [all, setAll] = useState(false);
  // Same ordering as the summary: effect weighted by sample size, too-small samples last.
  const score = (x: TagEffect) => (x.exposed.n < config.food.minMeals ? -1 : shrink(x.difference ?? 0, x.exposed.n, config));
  const rows = tags.filter((x) => x.exposed.n > 0 && x.reference.n > 0).sort((a, b) => score(b) - score(a));
  const shown = all ? rows : rows.slice(0, 6);

  if (rows.length === 0) return <p className="text-sm text-ink-soft">{t("empty")}</p>;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs font-medium text-ink-soft" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm border border-ink bg-symptom" /> {t("with")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-[3px] rounded-full bg-ink" /> {t("without")}
        </span>
      </div>
      <ul className="space-y-3.5">
        {shown.map((row) => {
          const few = row.exposed.n < config.food.minMeals || row.confidence === "low";
          const w = (row.exposed.rate ?? 0) * 100;
          const ref = (row.reference.rate ?? 0) * 100;
          return (
            <li key={row.tag}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate font-semibold">{tagLabel(row.tag)}</span>
                <span className="tabular shrink-0 text-sm text-ink-soft">
                  <span className="font-bold text-ink">{percent(row.exposed.rate)}</span> · {percent(row.reference.rate)} · n={row.exposed.n}
                  {few ? <span className="ml-1.5 rounded-full bg-paper-deep px-1.5 py-0.5 font-sans">{t("few")}</span> : null}
                </span>
              </div>
              <div className="relative h-4 rounded-md bg-paper-deep" aria-hidden>
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-md", few ? "halftone bg-symptom-wash [--dot:var(--symptom-ink)]" : "bg-symptom")}
                  style={{ width: `${Math.max(3, w)}%` }}
                />
                <div className="absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-ink" style={{ left: `${ref}%` }} />
              </div>
              <span className="sr-only">
                {t("row", {
                  tag: tagLabel(row.tag),
                  hits: row.exposed.hits,
                  n: row.exposed.n,
                  rate: percent(row.exposed.rate),
                  ref: percent(row.reference.rate),
                })}
              </span>
            </li>
          );
        })}
      </ul>
      {rows.length > 6 ? (
        <button
          type="button"
          onClick={() => setAll((a) => !a)}
          className="mt-3 min-h-11 text-sm font-semibold underline decoration-dotted underline-offset-4"
          aria-expanded={all}
        >
          {all ? t("showLess") : t("showAll")}
        </button>
      ) : null}
    </div>
  );
}
