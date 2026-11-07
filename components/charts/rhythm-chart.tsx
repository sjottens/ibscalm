"use client";

import { scaleBand, scaleLinear } from "@visx/scale";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { DaySummary } from "@/lib/analysis";
import { addDays } from "@/lib/analysis/time";
import { formatDayShort } from "@/lib/format";

/**
 * Small multiples over the same days (one axis each, no dual axes):
 *   row 1 — highest symptom per day (pink bars, 0–10)
 *   row 2 — highest stress level (yellow diamonds, 1–5)
 *   row 3 — sleep quality (lavender dots, 1–5)
 * Each row has its own label, marks have ink outlines and distinct shapes, so colour is never the only cue.
 * Hover/focus a day for its values; a visually hidden table carries the same data.
 */
export function RhythmChart({ days }: { days: DaySummary[] }) {
  const t = useTranslations("insights.rhythm");
  const tc = useTranslations("common");
  const locale = useLocale();
  const id = useId();
  const [active, setActive] = useState<number | null>(null);

  // Continuous calendar range, so gaps (untracked days) show as gaps.
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const range: string[] = [];
  if (first && last) for (let d = first; d <= last && range.length < 120; d = addDays(d, 1)) range.push(d);

  const W = 360;
  const left = 0;
  const rowH = { sev: 74, stress: 30, sleep: 30 };
  const gap = 14;
  const H = rowH.sev + rowH.stress + rowH.sleep + gap * 2 + 18;
  const x = scaleBand<string>({ domain: range, range: [left, W], paddingInner: 0.28, paddingOuter: 0.05 });
  const ySev = scaleLinear<number>({ domain: [0, 10], range: [rowH.sev, 4] });
  const bw = Math.max(2, x.bandwidth());
  const yStress = rowH.sev + gap;
  const ySleep = yStress + rowH.stress + gap;

  const activeDay = active !== null ? range[active] : null;
  const activeData = activeDay ? byDate.get(activeDay) : undefined;

  return (
    <figure className="relative" aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="sr-only">
        {t("title")}. {t("body")}
      </figcaption>
      <div className="mb-2 flex gap-4 text-xs font-medium text-ink-soft" aria-hidden>
        <Legend shape="bar" color="var(--symptom)" label={t("severity")} />
        <Legend shape="diamond" color="var(--stress)" label={t("stress")} />
        <Legend shape="dot" color="var(--sleep)" label={t("sleep")} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden onMouseLeave={() => setActive(null)}>
        {/* recessive guides */}
        {[0, 5, 10].map((v) => (
          <line key={v} x1={0} x2={W} y1={ySev(v)} y2={ySev(v)} stroke="var(--line)" strokeDasharray={v === 0 ? undefined : "2 4"} />
        ))}
        <text x={W} y={ySev(10) - 2} textAnchor="end" fontSize="9" fill="var(--ink-soft)" fontFamily="var(--font-geist-mono)">
          10
        </text>
        <line x1={0} x2={W} y1={yStress + rowH.stress / 2} y2={yStress + rowH.stress / 2} stroke="var(--line)" />
        <line x1={0} x2={W} y1={ySleep + rowH.sleep / 2} y2={ySleep + rowH.sleep / 2} stroke="var(--line)" />

        {range.map((date, i) => {
          const d = byDate.get(date);
          const cx = (x(date) ?? 0) + bw / 2;
          const isActive = active === i;
          return (
            <g key={date} opacity={active === null || isActive ? 1 : 0.45}>
              {isActive ? <rect x={(x(date) ?? 0) - 2} y={0} width={bw + 4} height={H - 16} rx={4} fill="var(--paper-deep)" /> : null}
              {d && d.maxSeverity > 0 ? (
                <path
                  d={roundedTopBar((x(date) ?? 0), ySev(d.maxSeverity), bw, ySev(0) - ySev(d.maxSeverity), Math.min(4, bw / 2))}
                  fill="var(--symptom)"
                  stroke="var(--ink)"
                  strokeWidth={1}
                />
              ) : d ? (
                <line x1={cx - bw / 3} x2={cx + bw / 3} y1={ySev(0) - 1.5} y2={ySev(0) - 1.5} stroke="var(--ink-soft)" strokeWidth={1.5} strokeLinecap="round" />
              ) : null}
              {d && d.maxStress > 0 ? (
                <Diamond cx={cx} cy={yStress + rowH.stress / 2} r={2.5 + d.maxStress * 1.6} />
              ) : null}
              {d && d.sleepQuality ? (
                <circle cx={cx} cy={ySleep + rowH.sleep / 2} r={2.5 + d.sleepQuality * 1.5} fill="var(--sleep)" stroke="var(--ink)" strokeWidth={1} />
              ) : null}
              {/* hit target, larger than the mark */}
              <rect
                x={(x(date) ?? 0) - (x.step() - bw) / 2}
                y={0}
                width={x.step()}
                height={H}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onTouchStart={() => setActive(i)}
              />
            </g>
          );
        })}
        {/* first / last date labels */}
        {first ? (
          <text x={0} y={H - 2} fontSize="9.5" fill="var(--ink-soft)" fontFamily="var(--font-geist-mono)">
            {formatDayShort(first, locale)}
          </text>
        ) : null}
        {last ? (
          <text x={W} y={H - 2} textAnchor="end" fontSize="9.5" fill="var(--ink-soft)" fontFamily="var(--font-geist-mono)">
            {formatDayShort(last, locale)}
          </text>
        ) : null}
      </svg>

      {activeDay ? (
        <div
          className="pointer-events-none absolute top-6 z-10 rounded-xl border-[1.5px] border-ink bg-card px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${Math.min(70, Math.max(0, (((x(activeDay) ?? 0) + bw / 2) / W) * 100 - 15))}%`,
          }}
        >
          <p className="font-semibold first-letter:uppercase">{formatDayShort(activeDay, locale)}</p>
          {activeData ? (
            <p className="tabular mt-0.5 font-mono text-ink-soft">
              {t("severity")} {activeData.maxSeverity} · {t("stress")} {activeData.maxStress || "–"} · {t("sleep")} {activeData.sleepQuality ?? "–"}
            </p>
          ) : (
            <p className="mt-0.5 text-ink-soft">–</p>
          )}
        </div>
      ) : null}

      <table className="sr-only">
        <caption>{t("title")}</caption>
        <thead>
          <tr>
            <th scope="col">{tc("date")}</th>
            <th scope="col">{t("severity")}</th>
            <th scope="col">{t("stress")}</th>
            <th scope="col">{t("sleep")}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{formatDayShort(d.date, locale)}</th>
              <td>{d.maxSeverity}</td>
              <td>{d.maxStress || "–"}</td>
              <td>{d.sleepQuality ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function roundedTopBar(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

function Diamond({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <path d={`M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`} fill="var(--stress)" stroke="var(--ink)" strokeWidth={1} />;
}

function Legend({ shape, color, label }: { shape: "bar" | "diamond" | "dot"; color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 12 12">
        {shape === "bar" ? <rect x="2" y="1" width="8" height="11" rx="2" fill={color} stroke="var(--ink)" /> : null}
        {shape === "diamond" ? <path d="M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z" fill={color} stroke="var(--ink)" /> : null}
        {shape === "dot" ? <circle cx="6" cy="6" r="5" fill={color} stroke="var(--ink)" /> : null}
      </svg>
      {label}
    </span>
  );
}

