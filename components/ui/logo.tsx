import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";

/** Horizontal logo (public/logos/ibscalm-logo-horizontaal@2x.png, 1552×512). */
const LOGO = { src: "/logos/ibscalm-logo-horizontaal@2x.png", width: 1552, height: 512 };
/** Rounded app icon (public/logos/ibscalm-icon-rounded-512.png). */
const ICON = { src: "/logos/ibscalm-icon-rounded-512.png", width: 512, height: 512 };

const HEIGHT = { sm: 30, md: 38, lg: 56, xl: 72 } as const;

/**
 * The brand logo. In dark mode it sits on a light plate (`.logo-plate`), because the navy
 * lettering would otherwise disappear against the dark background.
 */
export function Logo({
  className,
  size = "md",
  priority = false,
}: {
  className?: string;
  size?: keyof typeof HEIGHT;
  priority?: boolean;
}) {
  const h = HEIGHT[size];
  const w = Math.round((LOGO.width / LOGO.height) * h);
  return (
    <span className={cn("logo-plate inline-flex shrink-0 items-center", className)}>
      <Image src={LOGO.src} alt={BRAND.name} width={w} height={h} priority={priority} sizes={`${w}px`} className="block h-auto" style={{ width: w, height: h }} />
    </span>
  );
}

/** Square app icon (decorative by default). */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return <Image src={ICON.src} alt="" aria-hidden width={size} height={size} sizes={`${size}px`} className={cn("block", className)} />;
}
