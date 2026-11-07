"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useUi } from "@/lib/store/ui";
import type { EntryKind } from "@/lib/db/types";
import { cn } from "@/lib/cn";
import { MealIcon, StressIcon, SymptomIcon } from "@/components/ui/icons";

const ACTIONS: { kind: EntryKind; Icon: typeof MealIcon; bg: string }[] = [
  { kind: "meal", Icon: MealIcon, bg: "bg-food" },
  { kind: "symptom", Icon: SymptomIcon, bg: "bg-symptom" },
  { kind: "stress", Icon: StressIcon, bg: "bg-stress" },
];

/**
 * The three big thumb buttons, docked just above the navigation.
 * `at` lets the timeline add entries to another day.
 */
export function ActionDock({ at, inline = false }: { at?: () => number; inline?: boolean }) {
  const t = useTranslations();
  const openEntry = useUi((s) => s.openEntry);
  return (
    <div
      className={cn(
        inline ? "" : "fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.6rem)] z-20 px-4 sm:bottom-[calc(env(safe-area-inset-bottom)+5rem)]",
      )}
    >
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2.5">
        {ACTIONS.map(({ kind, Icon, bg }, i) => (
          <motion.button
            key={kind}
            type="button"
            onClick={() => openEntry(kind, at ? { at: at() } : undefined)}
            aria-label={t("today.addAria", { kind: t(`kinds.${kind}`) })}
            initial={inline ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 500, damping: 30 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl text-base font-bold text-on-spot shadow-[var(--shadow-md)]",
              bg,
            )}
          >
            <Icon size={24} />
            {t(`kinds.${kind}`)}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
