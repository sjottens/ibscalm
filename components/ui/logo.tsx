import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * Wordmark: a calm wave mark (a gut settling down) next to the name.
 * "IBS" in bold navy, "Calm" in regular weight — readable at any size.
 */
export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const text = { sm: "text-[1.2rem]", md: "text-[1.45rem]", lg: "text-[2.2rem]", xl: "text-[3rem]" }[size];
  const mark = { sm: 26, md: 30, lg: 44, xl: 60 }[size];
  const split = BRAND.name.match(/^([A-Z]+)(.*)$/);
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none", text, className)}>
      <LogoMark size={mark} />
      <span className="tracking-[-0.01em]">
        {split ? (
          <>
            <span className="font-extrabold">{split[1]}</span>
            <span className="font-medium">{split[2]}</span>
          </>
        ) : (
          <span className="font-extrabold">{BRAND.name}</span>
        )}
      </span>
    </span>
  );
}

/** App mark: rounded navy square with a gentle wave settling into a straight line. */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#1b2b48" />
      <path d="M10 26c3.5-6 7-6 10 0s5.5 4.5 8 0 5-3 10-1" stroke="#f5d33d" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
