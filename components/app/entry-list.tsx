"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import type { Entry } from "@/lib/db/types";
import { useTagLabel } from "@/lib/hooks/data";
import { useUi } from "@/lib/store/ui";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Tag } from "@/components/ui/controls";
import { KIND_ICON } from "@/components/ui/icons";

const badge = { meal: "bg-food", symptom: "bg-symptom", stress: "bg-stress" } as const;

/** Chronological "clippings". Tap one to edit it. The newest save plops in like a sticker. */
export function EntryList({ entries, label }: { entries: Entry[]; label: string }) {
  const lastSavedId = useUi((s) => s.lastSavedId);
  const reduce = useReducedMotion();
  return (
    <ol aria-label={label} className="relative space-y-2.5">
      {/* the thread that ties the day together */}
      <span aria-hidden className="absolute bottom-4 left-[3.35rem] top-4 w-px bg-line-strong" />
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.li
            key={e.id}
            layout={!reduce}
            initial={e.id === lastSavedId && !reduce ? { opacity: 0, scale: 0.7, rotate: -4 } : false}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 520, damping: 26 }}
          >
            <EntryRow entry={e} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  const t = useTranslations();
  const locale = useLocale();
  const tagLabel = useTagLabel();
  const openEntry = useUi((s) => s.openEntry);
  const Icon = KIND_ICON[entry.kind];

  let title: string;
  let detail: React.ReactNode = null;
  if (entry.kind === "meal") {
    title = entry.description || entry.tags.map(tagLabel).join(", ") || t("kinds.meal");
    detail =
      entry.tags.length || entry.size !== "normal" ? (
        <span className="mt-1.5 flex flex-wrap gap-1">
          {entry.size !== "normal" ? <Tag spot="food">{t(`sizes.${entry.size}`)}</Tag> : null}
          {entry.tags.map((id) => (
            <Tag key={id} spot="food">
              {tagLabel(id)}
            </Tag>
          ))}
        </span>
      ) : null;
  } else if (entry.kind === "symptom") {
    title = entry.types.map((x) => t(`symptomTypes.${x}`)).join(", ");
    detail = (
      <span className="mt-1.5 flex items-center gap-2 text-sm text-ink-soft">
        <SeverityMeter value={entry.severity} />
        <span className="tabular font-mono font-semibold text-symptom-ink">{entry.severity}</span>
        {t("severity.word", { value: String(entry.severity) })}
        {entry.bristol ? <span className="font-mono">· B{entry.bristol}</span> : null}
      </span>
    );
  } else {
    title = t(`stressTriggers.${entry.trigger}`);
    detail = (
      <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <LevelDots value={entry.level} />
        {t("stressLevel.word", { value: String(entry.level) })}
        {entry.anticipatory ? <Tag spot="stress">{t("entry.stress.anticipatory").toLowerCase()}</Tag> : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openEntry(entry.kind, { editing: entry })}
      className="paper-card group flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:border-line-strong active:scale-[0.99]"
    >
      <span className="tabular w-11 shrink-0 pt-1.5 font-mono text-[0.8rem] font-medium text-ink-soft">{formatTime(entry.timestamp, locale)}</span>
      <span className={cn("relative z-[1] grid h-9 w-9 shrink-0 place-items-center rounded-full border-[1.5px] border-ink text-on-spot", badge[entry.kind])}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1 pt-1">
        <span className="sr-only">{t(`kinds.${entry.kind}`)}: </span>
        <span className="block truncate font-semibold leading-snug">{title}</span>
        {detail}
        {entry.note ? <span className="mt-1 block truncate text-sm italic text-ink-soft">“{entry.note}”</span> : null}
      </span>
      <span className="sr-only">— {t("common.edit")}</span>
    </button>
  );
}

export function SeverityMeter({ value }: { value: number }) {
  return (
    <span aria-hidden className="inline-flex h-2.5 w-16 overflow-hidden rounded-full border border-ink/30 bg-paper-deep">
      <span className="h-full rounded-full bg-symptom" style={{ width: `${Math.max(4, value * 10)}%` }} />
    </span>
  );
}

export function LevelDots({ value }: { value: number }) {
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("h-2.5 w-2.5 rounded-full border border-ink/40", i <= value ? "bg-stress" : "bg-paper-deep")} />
      ))}
    </span>
  );
}
