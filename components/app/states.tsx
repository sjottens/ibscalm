import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Loading state: a calm progress bar (CSS only, works before hydration). */
export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="grid min-h-[70dvh] place-items-center" role="status" aria-live="polite">
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-paper-deep" aria-hidden>
        <div className="h-full w-1/3 animate-[load_1.1s_ease-in-out_infinite] rounded-full bg-ink" />
      </div>
      <span className="sr-only">{label ?? "Laden…"}</span>
      <style>{"@keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}"}</style>
    </div>
  );
}

/** Skeleton line in the paper style. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-paper-deep", className)} aria-hidden />;
}

/**
 * Empty state illustration: overlapping riso shapes (an empty plate, a cup and a leaf),
 * printed in two inks.
 */
export function EmptyIllustration({ variant = "plate", className }: { variant?: "plate" | "chart" | "day"; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn("h-28 w-auto", className)} aria-hidden>
      {variant === "plate" ? (
        <>
          <ellipse cx="74" cy="72" rx="52" ry="30" fill="var(--food)" opacity="0.9" />
          <ellipse cx="80" cy="66" rx="52" ry="30" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
          <ellipse cx="80" cy="66" rx="30" ry="16" fill="none" stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 5" />
          <circle cx="128" cy="30" r="14" fill="var(--symptom)" style={{ mixBlendMode: "multiply" }} />
          <path d="M28 28c8-10 20-10 24 2-10 6-18 6-24-2Z" fill="var(--stress)" stroke="var(--ink)" strokeWidth="2" />
        </>
      ) : variant === "chart" ? (
        <>
          <rect x="22" y="70" width="18" height="30" rx="3" fill="var(--food)" />
          <rect x="50" y="48" width="18" height="52" rx="3" fill="var(--symptom)" />
          <rect x="78" y="60" width="18" height="40" rx="3" fill="var(--stress)" />
          <rect x="106" y="34" width="18" height="66" rx="3" fill="var(--sleep)" />
          <path d="M18 100h126" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 64l30-22 28 14 30-28" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeDasharray="4 6" strokeLinecap="round" />
          <circle cx="114" cy="28" r="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        </>
      ) : (
        <>
          <rect x="30" y="20" width="100" height="84" rx="12" fill="var(--sleep)" opacity="0.85" transform="rotate(-4 80 62)" />
          <rect x="34" y="16" width="100" height="84" rx="12" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />
          <path d="M50 42h50M50 58h36M50 74h44" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="118" cy="90" r="12" fill="var(--stress)" stroke="var(--ink)" strokeWidth="2.5" />
        </>
      )}
    </svg>
  );
}

export function EmptyState({
  title,
  body,
  action,
  variant,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  variant?: "plate" | "chart" | "day";
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <EmptyIllustration variant={variant} />
      <h2 className="mt-5 font-display text-xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-xs text-ink-soft">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
