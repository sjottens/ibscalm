import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";
import { CALM_PATH, IBS_PATH, LOGO_COLORS, LOGO_HEIGHT, LOGO_WIDTH, WAVE_PATH } from "./logo-data";

const HEIGHT = { sm: 30, md: 36, lg: 56, xl: 72 } as const;

function Mark() {
  return (
    <>
      <rect width="48" height="48" rx="13" fill={LOGO_COLORS.teal} />
      <path d={WAVE_PATH} fill="none" stroke={LOGO_COLORS.coral} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/**
 * The IBScalm logo ("calm wave"), drawn as inline SVG so it is sharp at every size.
 * "ibs" follows the theme (--logo-ibs: navy on light, cream on dark); `onDark` forces the cream version.
 */
export function Logo({
  className,
  size = "md",
  onDark = false,
}: {
  className?: string;
  size?: keyof typeof HEIGHT;
  onDark?: boolean;
  /** Kept for API compatibility (the logo is inline SVG now, so nothing to prioritise). */
  priority?: boolean;
}) {
  const h = HEIGHT[size];
  const w = Math.round((LOGO_WIDTH / LOGO_HEIGHT) * h);
  return (
    <svg
      viewBox={`0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}`}
      width={w}
      height={h}
      role="img"
      aria-label={BRAND.name}
      className={cn("block shrink-0", className)}
    >
      <Mark />
      <path d={IBS_PATH} fill={onDark ? LOGO_COLORS.cream : "var(--logo-ibs)"} />
      <path d={CALM_PATH} fill={LOGO_COLORS.coral} />
    </svg>
  );
}

/** Square app icon (decorative). */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={cn("block", className)}>
      <Mark />
    </svg>
  );
}
