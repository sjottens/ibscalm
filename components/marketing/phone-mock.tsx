import { getTranslations } from "next-intl/server";
import type { Entry } from "@/lib/db/types";
import { DayStrip } from "@/components/app/day-strip";
import { MealIcon, StressIcon, SymptomIcon } from "@/components/ui/icons";

const at = (h: number, m = 0) => new Date(2026, 10, 7, h, m).getTime();
const base = { createdAt: 0, updatedAt: 0, deletedAt: null };
const MOCK: Entry[] = [
  { kind: "meal", id: "m1", timestamp: at(8, 10), description: "", tags: [], size: "normal", ...base },
  { kind: "stress", id: "s1", timestamp: at(10, 30), level: 4, trigger: "deadline", anticipatory: false, ...base },
  { kind: "meal", id: "m2", timestamp: at(12, 40), description: "", tags: [], size: "normal", ...base },
  { kind: "symptom", id: "x1", timestamp: at(16, 5), types: ["bloating"], severity: 6, ...base },
  { kind: "meal", id: "m3", timestamp: at(18, 30), description: "", tags: [], size: "normal", ...base },
];

/** A phone showing the Today screen, built from the real components (no screenshot). */
export async function PhoneMock() {
  const t = await getTranslations("landing.mock");
  const tk = await getTranslations("kinds");
  const rows = [
    { time: "08:10", Icon: MealIcon, bg: "bg-food", title: t("breakfast") },
    { time: "10:30", Icon: StressIcon, bg: "bg-stress", title: t("stress") },
    { time: "12:40", Icon: MealIcon, bg: "bg-food", title: t("lunch") },
    { time: "16:05", Icon: SymptomIcon, bg: "bg-symptom", title: t("symptom") },
  ];
  return (
    <div className="mx-auto w-[min(18.5rem,80vw)]" aria-hidden>
      <div className="rounded-[2.4rem] bg-ink p-2.5 shadow-[0_20px_50px_rgb(16_24_40/0.18)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-paper px-4 pb-4 pt-9">
          <div className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-ink" />
          <p className="text-xs font-semibold text-ink-soft">{t("date")}</p>
          <p className="text-2xl font-black">{t("headline")}</p>
          <div className="paper-card mt-3 p-2.5">
            <DayStrip entries={MOCK} nowHour={17.2} className="h-auto w-full" />
          </div>
          <ul className="mt-3 space-y-1.5">
            {rows.map((r) => (
              <li key={r.time} className="flex items-center gap-2 rounded-lg border border-line bg-card px-2 py-1.5">
                <span className="tabular text-[0.66rem] font-semibold text-ink-soft">{r.time}</span>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-on-spot ${r.bg}`}>
                  <r.Icon size={13} />
                </span>
                <span className="truncate text-[0.75rem] font-semibold">{r.title}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {(["meal", "symptom", "stress"] as const).map((k, i) => (
              <span key={k} className={`flex h-11 items-center justify-center rounded-lg text-[0.68rem] font-bold text-on-spot ${["bg-food", "bg-symptom", "bg-stress"][i]}`}>
                {tk(k)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
