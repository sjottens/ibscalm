import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CompareRow {
  label: string;
  /** 0–1 */
  value: number | null;
  display: string;
  sub?: string;
  emphasis?: boolean;
}

/**
 * Two (or three) horizontal bars on one shared 0–max scale, values printed next to them.
 * The exposed group is filled with the spot colour; the reference group is a halftone in ink,
 * so the pair differs by texture as well as colour.
 */
export function CompareBars({
  rows,
  spot,
  max = 1,
  label,
}: {
  rows: CompareRow[];
  spot: "symptom" | "stress" | "sleep" | "food";
  max?: number;
  label: string;
}) {
  const fill = { symptom: "bg-symptom", stress: "bg-stress", sleep: "bg-sleep", food: "bg-food" }[spot];
  return (
    <div role="list" aria-label={label} className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} role="listitem" className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3">
          <span className={cn("text-sm leading-tight", r.emphasis ? "font-semibold" : "text-ink-soft")}>{r.label}</span>
          <span className="relative h-6 overflow-hidden rounded-md bg-paper-deep" aria-hidden>
            {r.value !== null ? (
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-r-[4px] border-r-[1.5px] border-ink",
                  r.emphasis ? cn(fill, "border-y-[1.5px] border-l-[1.5px] rounded-l-md") : "halftone [--dot:var(--ink-soft)]",
                )}
                style={{ width: `${Math.max(2, Math.min(100, (r.value / max) * 100))}%` }}
              />
            ) : null}
          </span>
          <span className="text-right">
            <span className={cn("tabular block font-mono text-sm", r.emphasis ? "font-bold" : "text-ink-soft")}>{r.display}</span>
            {r.sub ? <span className="block text-[0.7rem] text-ink-soft">{r.sub}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({
  title,
  body,
  children,
  riso = "var(--ink)",
  footer,
  id,
}: {
  title: string;
  body?: string;
  children: ReactNode;
  riso?: string;
  footer?: ReactNode;
  id?: string;
}) {
  return (
    <section className="paper-card riso-shadow p-5" style={{ ["--riso" as string]: riso }} aria-labelledby={id}>
      <h2 id={id} className="font-display text-[1.35rem] font-extrabold leading-tight">
        {title}
      </h2>
      {body ? <p className="mt-1 text-sm text-ink-soft">{body}</p> : null}
      <div className="mt-4">{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}
