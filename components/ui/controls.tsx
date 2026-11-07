"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon, MinusIcon, PlusIcon } from "./icons";

export type Spot = "food" | "symptom" | "stress" | "sleep";

const spotBg: Record<Spot, string> = {
  food: "bg-food",
  symptom: "bg-symptom",
  stress: "bg-stress",
  sleep: "bg-sleep",
};
const spotSelected: Record<Spot, string> = {
  food: "bg-food-wash text-food-ink ring-2 ring-inset ring-food",
  symptom: "bg-symptom-wash text-symptom-ink ring-2 ring-inset ring-symptom",
  stress: "bg-stress-wash text-stress-ink ring-2 ring-inset ring-stress",
  sleep: "bg-sleep-wash text-sleep-ink ring-2 ring-inset ring-sleep",
};
const spotWash: Record<Spot, string> = {
  food: "bg-food-wash text-food-ink",
  symptom: "bg-symptom-wash text-symptom-ink",
  stress: "bg-stress-wash text-stress-ink",
  sleep: "bg-sleep-wash text-sleep-ink",
};
export const spotVar: Record<Spot, string> = {
  food: "var(--food)",
  symptom: "var(--symptom)",
  stress: "var(--stress)",
  sleep: "var(--sleep)",
};
export const spotInkVar: Record<Spot, string> = {
  food: "var(--food-ink)",
  symptom: "var(--symptom-ink)",
  stress: "var(--stress-ink)",
  sleep: "var(--sleep-ink)",
};
export const kindSpot = { meal: "food", symptom: "symptom", stress: "stress" } as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "spot" | "ghost" | "outline" | "danger";
  /** Kept for API compatibility; buttons no longer take category colours. */
  spot?: Spot;
  size?: "md" | "lg";
  icon?: ReactNode;
};

/**
 * Buttons are flat and consistent. "spot" is the main call to action (yellow with navy text),
 * "primary" is navy. Category colours are never used on buttons, so the action colour always means "do this".
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", spot: _spot, size = "md", icon, className, children, ...props },
  ref,
) {
  void _spot;
  const base =
    "relative inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45";
  const sizes = { md: "min-h-12 px-5 text-base", lg: "min-h-14 px-6 text-[1.0625rem]" };
  const variants = {
    primary: "bg-ink text-paper hover:opacity-90",
    spot: "bg-accent text-[#1b2b48] hover:bg-accent-hover",
    ghost: "text-ink hover:bg-paper-deep",
    outline: "border border-line-strong bg-card text-ink hover:bg-paper-deep",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return (
    <button ref={ref} type="button" className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {icon}
      {children}
    </button>
  );
});

/** Toggle chip (aria-pressed). Selected state shows a check mark, a tint and a ring — never colour alone. */
export function Chip({
  selected,
  onToggle,
  spot = "food",
  children,
  className,
  ...props
}: {
  selected: boolean;
  onToggle: () => void;
  spot?: Spot;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[0.95rem] font-medium transition-colors",
        selected ? cn(spotSelected[spot], "border-transparent") : "border-line-strong bg-card text-ink hover:border-ink-soft",
        className,
      )}
      {...props}
    >
      {selected ? <CheckIcon size={16} strokeWidth={2.6} /> : null}
      {children}
    </button>
  );
}

/** Tinted label for read-only lists. */
export function Tag({ spot, children, className }: { spot: Spot; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[0.85rem] font-medium", spotWash[spot], className)}>
      {children}
    </span>
  );
}

/**
 * Single-choice row of buttons (radiogroup, arrow keys move the selection).
 * Used for severity 0–10, stress 1–5, sleep 1–5 and portion size.
 */
export function ScalePicker<T extends string | number>({
  label,
  options,
  value,
  onChange,
  spot = "symptom",
  renderOption,
  describe,
  allowClear = false,
  columns,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T | null) => void;
  spot?: Spot;
  renderOption?: (v: T) => ReactNode;
  describe?: (v: T) => string;
  allowClear?: boolean;
  columns?: number;
}) {
  const id = useId();
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = options[(i + delta + options.length) % options.length];
    onChange(next);
    document.getElementById(`${id}-${String(next)}`)?.focus();
  };
  const focusIndex = value === null ? 0 : Math.max(0, options.indexOf(value));
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt, i) => {
        const selected = opt === value;
        return (
          <button
            key={String(opt)}
            id={`${id}-${String(opt)}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={describe ? describe(opt) : String(opt)}
            tabIndex={i === focusIndex ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(selected && allowClear ? null : opt)}
            className={cn(
              "tabular flex min-h-12 items-center justify-center rounded-lg border text-base font-semibold transition-colors",
              selected
                ? cn(spotBg[spot], "border-transparent text-on-spot ring-2 ring-ink ring-offset-1 ring-offset-paper")
                : "border-line-strong bg-card text-ink hover:border-ink-soft",
            )}
          >
            {renderOption ? renderOption(opt) : String(opt)}
          </button>
        );
      })}
    </div>
  );
}

/** − value + stepper with large targets. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  unit,
  decreaseLabel,
  increaseLabel,
  label,
}: {
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  decreaseLabel: string;
  increaseLabel: string;
  label: string;
}) {
  const v = value ?? 0;
  const btn =
    "grid h-12 w-12 place-items-center rounded-lg border border-line-strong bg-card text-ink transition hover:bg-paper-deep disabled:opacity-35";
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" aria-label={decreaseLabel} onClick={() => onChange(Math.max(min, v - step))} disabled={v <= min} className={btn}>
        <MinusIcon size={20} />
      </button>
      <output aria-live="polite" className="tabular min-w-16 text-center text-lg font-semibold">
        {v}
        {unit ? <span className="ml-1 text-sm font-normal text-ink-soft">{unit}</span> : null}
      </output>
      <button type="button" aria-label={increaseLabel} onClick={() => onChange(Math.min(max, v + step))} disabled={v >= max} className={btn}>
        <PlusIcon size={20} />
      </button>
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  description?: string;
  spot?: Spot;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {description ? (
          <span id={`${id}-d`} className="mt-0.5 block text-sm text-ink-soft">
            {description}
          </span>
        ) : null}
      </label>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={description ? `${id}-d` : undefined}
        className={cn("relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors", checked ? "bg-ink" : "bg-line-strong")}
      >
        <SwitchPrimitive.Thumb className="block h-6 w-6 translate-x-1 rounded-full bg-white shadow transition-transform duration-200 data-[state=checked]:translate-x-7" />
      </SwitchPrimitive.Root>
    </div>
  );
}

export function FieldLabel({ children, hint, htmlFor, as = "label" }: { children: ReactNode; hint?: ReactNode; htmlFor?: string; as?: "label" | "h3" }) {
  const Tag = as;
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <Tag {...(as === "label" ? { htmlFor } : {})} className="text-[1.05rem] font-bold">
        {children}
      </Tag>
      {hint ? <span className="text-sm text-ink-soft">{hint}</span> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-card px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2";

/** Section heading: small label + title. */
export function SectionTitle({ kicker, title, id, className }: { kicker?: string; title: string; id?: string; className?: string }) {
  return (
    <div className={className}>
      {kicker ? <p className="mb-1 text-sm font-semibold text-ink-soft">{kicker}</p> : null}
      <h2 id={id} className="text-[1.4rem] font-extrabold leading-tight">
        {title}
      </h2>
    </div>
  );
}
