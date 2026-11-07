import { getTranslations } from "next-intl/server";
import type { Entry } from "@/lib/db/types";
import { DayStrip } from "@/components/app/day-strip";
import { CheckIcon, MealIcon, StressIcon, SymptomIcon } from "@/components/ui/icons";

const at = (h: number, m = 0) => new Date(2026, 10, 7, h, m).getTime();
const base = { createdAt: 0, updatedAt: 0, deletedAt: null };
const MOCK: Entry[] = [
  { kind: "meal", id: "m1", timestamp: at(8, 10), description: "", tags: [], size: "normal", ...base },
  { kind: "stress", id: "s1", timestamp: at(10, 30), level: 4, trigger: "deadline", anticipatory: false, ...base },
  { kind: "meal", id: "m2", timestamp: at(12, 40), description: "", tags: [], size: "normal", ...base },
  { kind: "symptom", id: "x1", timestamp: at(16, 5), types: ["bloating"], severity: 6, ...base },
  { kind: "meal", id: "m3", timestamp: at(18, 30), description: "", tags: [], size: "normal", ...base },
];

/** A real-looking phone with the Today screen, built from the actual components (no screenshot). */
export async function PhoneMock() {
  const t = await getTranslations("landing.mock");
  const tk = await getTranslations("kinds");
  const rows = [
    { time: "08:10", Icon: MealIcon, bg: "bg-food", title: t("breakfast"), sub: "" },
    { time: "10:30", Icon: StressIcon, bg: "bg-stress", title: t("stress"), sub: "● ● ● ●" },
    { time: "12:40", Icon: MealIcon, bg: "bg-food", title: t("lunch"), sub: "" },
    { time: "16:05", Icon: SymptomIcon, bg: "bg-symptom", title: t("symptom"), sub: "6" },
  ];
  return (
    <div className="relative mx-auto w-[min(19rem,82vw)]" aria-hidden>
      <div className="relative rounded-[2.8rem] border-[2.5px] border-ink bg-ink p-2.5 shadow-[14px_14px_0_0_var(--symptom)]">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-paper px-4 pb-4 pt-9">
          <div className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-ink" />
          <div className="flex justify-between font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-soft">
            <span>{t("date")}</span>
            <span>wk 45</span>
          </div>
          <div className="perforation mt-1.5" />
          <p className="riso-text mt-3 font-display text-[1.75rem] font-extrabold leading-none [--riso:var(--stress)]">{t("headline")}</p>
          <div className="paper-card mt-3 p-2.5">
            <DayStrip entries={MOCK} nowHour={17.2} className="h-auto w-full" />
          </div>
          <ul className="mt-3 space-y-1.5">
            {rows.map((r) => (
              <li key={r.time} className="flex items-center gap-2 rounded-xl border-[1.5px] border-line bg-card px-2 py-1.5">
                <span className="tabular font-mono text-[0.6rem] text-ink-soft">{r.time}</span>
                <span className={`grid h-6 w-6 place-items-center rounded-full border border-ink text-on-spot ${r.bg}`}>
                  <r.Icon size={13} />
                </span>
                <span className="truncate text-[0.72rem] font-semibold">{r.title}</span>
                {r.sub ? <span className="ml-auto font-mono text-[0.6rem] text-ink-soft">{r.sub}</span> : null}
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {(["meal", "symptom", "stress"] as const).map((k, i) => (
              <span
                key={k}
                className={`flex h-11 flex-col items-center justify-center rounded-xl border-[1.5px] border-ink text-[0.62rem] font-extrabold text-on-spot shadow-[2px_2px_0_0_var(--ink)] ${["bg-food", "bg-symptom", "bg-stress"][i]}`}
              >
                {tk(k)}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* Floating stickers */}
      <div className="absolute -left-10 top-24 rotate-[-8deg] rounded-xl border-[2.5px] border-symptom bg-card px-3 py-1.5 font-display text-sm font-extrabold uppercase tracking-[0.08em] text-symptom-ink shadow-lg max-sm:-left-3">
        <span className="inline-flex items-center gap-1.5">
          <CheckIcon size={15} strokeWidth={3} /> {tk("meal")} ✓
        </span>
      </div>
      <div className="absolute -right-12 bottom-28 w-44 rotate-[5deg] rounded-2xl border-[1.5px] border-ink bg-card p-3 shadow-[5px_5px_0_0_var(--food)] max-sm:-right-4">
        <p className="text-[0.66rem] text-ink-soft">{t("summary")}</p>
        <p className="font-display text-lg font-extrabold leading-tight">
          <span className="rounded bg-food px-1">{t("factor")}</span>
        </p>
        <p className="mt-1 text-[0.62rem] text-ink-soft">{t("detail")}</p>
      </div>
    </div>
  );
}
