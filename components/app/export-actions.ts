"use client";

import { updateSettings } from "@/lib/db/repo";
import { buildExport, downloadText, exportFileName, toCsv } from "@/lib/export";

/** Downloads a JSON backup and remembers when it was made. */
export async function exportBackup() {
  const file = await buildExport();
  downloadText(JSON.stringify(file, null, 2), exportFileName("json"), "application/json");
  await updateSettings({ lastBackupAt: Date.now(), backupSnoozedUntil: null });
}

export async function exportCsv(tagLabel: (id: string) => string) {
  const file = await buildExport();
  downloadText(toCsv(file, tagLabel), exportFileName("csv"), "text/csv");
}
