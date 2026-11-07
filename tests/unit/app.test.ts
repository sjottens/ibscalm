import { describe, expect, it } from "vitest";
import nl from "@/messages/nl.json";
import en from "@/messages/en.json";
import { shouldRemindBackup } from "@/components/app/backup-reminder";
import { withBrand } from "@/i18n/with-brand";
import { BRAND } from "@/lib/brand";
import { DAY } from "@/lib/analysis/time";

type Tree = { [k: string]: string | Tree };
const keys = (t: Tree, prefix = ""): string[] =>
  Object.entries(t).flatMap(([k, v]) => (typeof v === "string" ? [prefix + k] : keys(v, `${prefix}${k}.`)));

describe("translations", () => {
  it("Dutch and English have exactly the same keys", () => {
    expect(keys(en as Tree).sort()).toEqual(keys(nl as Tree).sort());
  });

  it("injects the brand name everywhere", () => {
    const out = withBrand(nl as Tree) as typeof nl;
    expect(out.meta.title).toContain(BRAND.name);
    expect(JSON.stringify(out)).not.toContain("{brand}");
  });
});

describe("backup reminder", () => {
  const now = 100 * DAY;
  const s = (lastBackupAt: number | null, backupSnoozedUntil: number | null = null) => ({ lastBackupAt, backupSnoozedUntil });

  it("waits until there is something worth backing up", () => {
    expect(shouldRemindBackup(s(null), now - 30 * DAY, 3, now)).toBeNull();
    expect(shouldRemindBackup(s(null), now - 3 * DAY, 20, now)).toBeNull();
  });

  it("nudges after a week without any backup", () => {
    expect(shouldRemindBackup(s(null), now - 8 * DAY, 20, now)).toBe("never");
  });

  it("nudges again 14 days after the last backup", () => {
    expect(shouldRemindBackup(s(now - 13 * DAY), now - 60 * DAY, 99, now)).toBeNull();
    expect(shouldRemindBackup(s(now - 15 * DAY), now - 60 * DAY, 99, now)).toBe("old");
  });

  it("respects 'later'", () => {
    expect(shouldRemindBackup(s(null, now + DAY), now - 30 * DAY, 99, now)).toBeNull();
  });
});
