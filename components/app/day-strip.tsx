import type { Entry } from "@/lib/db/types";
import { localHour } from "@/lib/analysis/time";

/**
 * The signature graphic: a 24-hour print strip. Meals are mint dots on the baseline,
 * symptoms rise as pink bars (height = severity), stress shows as yellow diamonds.
 * Decorative summary — the list next to it carries the same information for screen readers.
 */
export function DayStrip({
  entries,
  nowHour,
  className,
  compact = false,
}: {
  entries: Entry[];
  nowHour?: number | null;
  className?: string;
  compact?: boolean;
}) {
  const W = 340;
  const H = compact ? 46 : 72;
  const base = H - (compact ? 10 : 18);
  const top = 6;
  const x = (h: number) => 8 + (h / 24) * (W - 16);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden>
      {/* hour ticks */}
      {Array.from({ length: 25 }, (_, h) => (
        <line
          key={h}
          x1={x(h)}
          x2={x(h)}
          y1={base}
          y2={base + (h % 6 === 0 ? 6 : 3)}
          stroke="var(--line-strong)"
          strokeWidth={h % 6 === 0 ? 1.4 : 1}
        />
      ))}
      <line x1={x(0)} x2={x(24)} y1={base} y2={base} stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" />
      {!compact
        ? [0, 6, 12, 18, 24].map((h) => (
            <text
              key={h}
              x={x(h)}
              y={H - 1}
              textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}
              fontSize="9"
              fontFamily="var(--font-figtree)"
              fill="var(--ink-soft)"
            >
              {String(h).padStart(2, "0")}
            </text>
          ))
        : null}

      {nowHour != null ? (
        <g>
          <line x1={x(nowHour)} x2={x(nowHour)} y1={top - 2} y2={base} stroke="var(--ink)" strokeWidth={1} strokeDasharray="2 3" />
          <circle cx={x(nowHour)} cy={top - 1} r={2.4} fill="var(--ink)" />
        </g>
      ) : null}

      {entries
        .filter((e) => e.kind === "symptom")
        .map((e) => {
          const hx = x(localHour(e.timestamp));
          const h = Math.max(4, ((e.kind === "symptom" ? e.severity : 0) / 10) * (base - top));
          return (
            <g key={e.id}>
              <rect x={hx - 4} y={base - h} width={7} height={h} rx={2} fill="var(--symptom)" stroke="var(--ink)" strokeWidth={1.2} />
            </g>
          );
        })}
      {entries
        .filter((e) => e.kind === "stress")
        .map((e) => {
          const hx = x(localHour(e.timestamp));
          const s = 4 + (e.kind === "stress" ? e.level : 3);
          const cy = base - 10 - (e.kind === "stress" ? e.level : 3) * 3;
          return (
            <path
              key={e.id}
              d={`M${hx} ${cy - s} L${hx + s} ${cy} L${hx} ${cy + s} L${hx - s} ${cy} Z`}
              fill="var(--stress)"
              stroke="var(--ink)"
              strokeWidth={1.2}
            />
          );
        })}
      {entries
        .filter((e) => e.kind === "meal")
        .map((e) => (
          <circle key={e.id} cx={x(localHour(e.timestamp))} cy={base} r={5.2} fill="var(--food)" stroke="var(--ink)" strokeWidth={1.3} />
        ))}
    </svg>
  );
}
