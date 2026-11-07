"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { updateSettings } from "@/lib/db/repo";
import { useEntryCount, useFirstEntryTime, useNow, useSettings } from "@/lib/hooks/data";
import { useUi } from "@/lib/store/ui";
import { DAY } from "@/lib/analysis/time";
import { Button } from "@/components/ui/controls";
import { DownloadIcon } from "@/components/ui/icons";
import { exportBackup } from "./export-actions";

/** When to nudge: after a week of tracking without backup, or 14 days after the last one. */
export function shouldRemindBackup(
  { lastBackupAt, backupSnoozedUntil }: { lastBackupAt: number | null; backupSnoozedUntil: number | null },
  firstEntry: number | null,
  entryCount: number,
  now: number,
): "never" | "old" | null {
  if (entryCount < 5 || firstEntry === null) return null;
  if (backupSnoozedUntil && backupSnoozedUntil > now) return null;
  if (lastBackupAt === null) return now - firstEntry >= 7 * DAY ? "never" : null;
  return now - lastBackupAt >= 14 * DAY ? "old" : null;
}

export function BackupReminder() {
  const t = useTranslations("backup");
  const settings = useSettings();
  const first = useFirstEntryTime();
  const count = useEntryCount();
  const showToast = useUi((s) => s.showToast);
  const now = useNow();
  const reason = settings && first !== undefined && count !== undefined ? shouldRemindBackup(settings, first, count, now) : null;

  return (
    <AnimatePresence>
      {reason ? (
        <motion.aside
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
          aria-labelledby="backup-title"
        >
          <div className="mt-5 rounded-[var(--radius-card)] border-[1.5px] border-ink bg-sleep-wash p-4">
            <h2 id="backup-title" className="font-display text-lg font-extrabold">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {reason === "never"
                ? t("bodyNever")
                : t("bodyOld", { days: Math.floor((now - (settings!.lastBackupAt ?? now)) / DAY) })}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="spot"
                spot="sleep"
                icon={<DownloadIcon size={18} />}
                onClick={async () => {
                  await exportBackup();
                  showToast({ message: t("done"), tone: "stamp" });
                }}
              >
                {t("action")}
              </Button>
              <Button variant="ghost" onClick={() => void updateSettings({ backupSnoozedUntil: Date.now() + 7 * DAY })}>
                {t("later")}
              </Button>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
