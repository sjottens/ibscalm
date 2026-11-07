"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { motion } from "motion/react";
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
  spot?: Spot;
  size?: "md" | "lg";
  icon?: ReactNode;
};

/** Pressable with a printed, off-register shadow that "stamps" down on press. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", spot = "symptom", size = "md", icon, className, children, ...props },
  ref,
) {
  const base =
    "relative inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition-[transform,box-shadow,background-color] duration-150 ease-[var(--ease-out-soft)] active:translate-x-[2px] active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-45";
  const sizes = { md: "min-h-12 px-5 text-[0.95rem]", lg: "min-h-14 px-6 text-base" };
  const variants = {
    primary: "bg-ink text-paper riso-shadow active:shadow-none [--riso:var(--symptom)]",
    spot: cn(spotBg[spot], "text-on-spot riso-shadow active:shadow-none [--riso:var(--ink)]"),
    ghost: "text-ink hover:bg-paper-deep",
    outline: "border-[1.5px] border-line-strong text-ink hover:bg-paper-deep",
    danger: "bg-danger text-paper riso-shadow active:shadow-none [--riso:var(--ink)]",
  };
  return (
    <button ref={ref} type="button" className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {icon}
      {children}
    </button>
  );
});

/** Toggle chip (aria-pressed). */
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
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[0.92rem] font-medium transition-colors",
        selected ? cn(spotBg[spot], "border-ink text-on-spot") : "border-line-strong bg-card text-ink hover:border-ink",
        className,
      )}
      {...(props as object)}
    >
      {selected ? <CheckIcon size={15} strokeWidth={2.6} /> : null}
      {children}
    </motion.button>
  );
}

/** Wash-coloured tag for read-only lists. */
export function Tag({ spot, children, className }: { spot: Spot; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.8rem] font-medium", spotWash[spot], className)}>
      {children}
    </span>
  );
}

/**
 * Single-choice row of big buttons (radiogroup with roving focus via arrow keys).
 * Used for severity 0–10, stress 1–5, sleep 1–5, portion size.
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
    const el = document.getElementById(`${id}-${String(next)}`);
    el?.focus();
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
          <motion.button
            key={String(opt)}
            id={`${id}-${String(opt)}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={describe ? describe(opt) : String(opt)}
            tabIndex={i === focusIndex ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(selected && allowClear ? null : opt)}
            whileTap={{ scale: 0.9 }}
            animate={selected ? { y: -2 } : { y: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 26 }}
            className={cn(
              "tabular flex min-h-12 items-center justify-center rounded-xl border-[1.5px] font-mono text-[0.95rem] font-semibold transition-colors",
              selected ? cn(spotBg[spot], "border-ink text-on-spot riso-shadow [--shadow-offset:2px] [--riso:var(--ink)]") : "border-line bg-card text-ink-soft hover:border-ink hover:text-ink",
            )}
          >
            {renderOption ? renderOption(opt) : String(opt)}
          </motion.button>
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
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={() => onChange(Math.max(min, v - step))}
        disabled={v <= min}
        className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-line-strong text-ink transition active:scale-90 disabled:opacity-35"
      >
        <MinusIcon size={20} />
      </button>
      <output aria-live="polite" className="tabular min-w-16 text-center font-mono text-lg font-semibold">
        {v}
        {unit ? <span className="ml-1 text-sm font-normal text-ink-soft">{unit}</span> : null}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={() => onChange(Math.min(max, v + step))}
        disabled={v >= max}
        className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-line-strong text-ink transition active:scale-90 disabled:opacity-35"
      >
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
  spot = "stress",
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
        className={cn(
          "relative mt-0.5 inline-flex h-8 w-14 shrink-0 items-center rounded-full border-[1.5px] border-ink transition-colors",
          checked ? spotBg[spot] : "bg-paper-deep",
        )}
      >
        <SwitchPrimitive.Thumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-ink transition-transform duration-200 ease-[var(--ease-stamp)] data-[state=checked]:translate-x-[1.6rem]" />
      </SwitchPrimitive.Root>
    </div>
  );
}

export function FieldLabel({ children, hint, htmlFor, as = "label" }: { children: ReactNode; hint?: ReactNode; htmlFor?: string; as?: "label" | "h3" }) {
  const Tag = as;
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <Tag {...(as === "label" ? { htmlFor } : {})} className="font-display text-[1.05rem] font-bold">
        {children}
      </Tag>
      {hint ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl border-[1.5px] border-line-strong bg-card px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2";

/** Section heading in the masthead style: small mono kicker + display title. */
export function SectionTitle({ kicker, title, id, className }: { kicker?: string; title: string; id?: string; className?: string }) {
  return (
    <div className={className}>
      {kicker ? <p className="mb-1 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink-soft">{kicker}</p> : null}
      <h2 id={id} className="font-display text-[1.45rem] font-extrabold leading-tight">
        {title}
      </h2>
    </div>
  );
}
