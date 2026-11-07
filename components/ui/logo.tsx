import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * Wordmark: the brand name in Bricolage, where the dot of the "i" is a little round belly
 * printed in riso pink, slightly off register. Works for any name: without an "i" the
 * belly sits after the last letter.
 */
export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const name = BRAND.name.toLowerCase();
  const i = name.indexOf("i");
  const text = {
    sm: "text-[1.35rem]",
    md: "text-[1.7rem]",
    lg: "text-[2.6rem]",
    xl: "text-[clamp(4rem,14vw,9rem)]",
  }[size];

  const Belly = (
    <span
      aria-hidden
      className="absolute left-1/2 top-[0.06em] h-[0.27em] w-[0.27em] -translate-x-1/2 rounded-full bg-symptom"
      style={{ boxShadow: "0.035em 0.03em 0 0 var(--stress)" }}
    />
  );

  return (
    <span className={cn("font-display inline-flex items-baseline font-extrabold leading-none tracking-[-0.045em]", text, className)}>
      <span className="sr-only">{BRAND.name}</span>
      <span aria-hidden className="inline-flex items-baseline">
        {i >= 0 ? (
          <>
            {name.slice(0, i)}
            <span className="relative inline-block">
              ı{Belly}
            </span>
            {name.slice(i + 1)}
          </>
        ) : (
          <>
            {name}
            <span className="relative inline-block w-[0.35em]">{Belly}</span>
          </>
        )}
      </span>
    </span>
  );
}

/** Square app mark: pink belly over an ink circle, slightly off register. */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--paper)" />
      <circle cx="34" cy="35" r="17" fill="var(--stress)" />
      <circle cx="31" cy="32" r="17" fill="var(--symptom)" style={{ mixBlendMode: "multiply" }} />
      <path d="M22 35c3-4 6-4 9 0s6 4 9 0" stroke="var(--ink)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
