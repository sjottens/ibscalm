import type { SVGProps } from "react";

/**
 * One consistent icon family: 24px grid, 2px rounded strokes, slightly hand-cut shapes.
 * Decorative by default (aria-hidden); pass a `title` when an icon stands alone.
 */
type IconProps = SVGProps<SVGSVGElement> & { title?: string; size?: number };

function Icon({ title, size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const MealIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 11.5h17a8.5 8 0 0 1-17 0Z" />
    <path d="M9 3.5c-.8 1 .8 2-.1 3.4M13.2 3.5c-.8 1 .8 2-.1 3.4" />
    <path d="M8 20.5h8" />
  </Icon>
);

export const SymptomIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5c4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5S3.5 16.7 3.5 12" />
    <path d="M7 12.5l2-3 2.5 5 2.5-5 2 3" />
  </Icon>
);

export const StressIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 7.5l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 2 1.7" />
    <path d="M3.5 13l3-2.5 3 2.5 3-2.5 3 2.5 3-2.5 2 1.7" />
    <path d="M3.5 18.5l3-2.5 3 2.5 3-2.5 3 2.5" />
  </Icon>
);

export const SleepIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 14.2A7.8 7.8 0 1 1 9.8 4.5a6.2 6.2 0 0 0 9.7 9.7Z" />
    <path d="M16 3.5h3.5L16 7.5h3.5" strokeWidth={1.8} />
  </Icon>
);

export const TodayIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
    <path d="M3.5 10h17M8 3v3.5M16 3v3.5" />
    <circle cx="12" cy="15.2" r="1.6" fill="currentColor" stroke="none" />
  </Icon>
);

export const TimelineIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5v17" />
    <circle cx="6" cy="7" r="2" fill="var(--paper)" />
    <circle cx="6" cy="16" r="2" fill="var(--paper)" />
    <path d="M11 7h9M11 16h6M11 11.5h7.5" />
  </Icon>
);

export const InsightsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20.5V14M9.3 20.5V9.5M14.6 20.5v-4.5M19.9 20.5V6" />
    <path d="M4 9.5l5.3-4.5 5.3 5 5.3-6.5" strokeWidth={1.8} />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2.2" />
    <circle cx="9" cy="17" r="2.2" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12.5l4.5 4.5 10.5-11" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 5.5L16 12l-6.5 6.5" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h15M13.5 6l6 6-6 6" />
  </Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5v11.5M7 10.5l5 5 5-5M4 20h16" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15.5V4M7 8.5l5-5 5 5M4 20h16" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </Icon>
);

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5l7.5 3v5.5c0 4.4-3.2 7.7-7.5 9-4.3-1.3-7.5-4.6-7.5-9V6.5Z" />
    <path d="M8.8 12.2l2.3 2.3 4.3-4.6" />
  </Icon>
);

export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M10.5 18.5h3" />
  </Icon>
);

export const NoEyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12s3.5-6.5 9-6.5 9 6.5 9 6.5-3.5 6.5-9 6.5S3 12 3 12Z" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M4 20L20 4" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const DropIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5c3.5 4.2 6 7.4 6 10.5a6 6 0 0 1-12 0c0-3.1 2.5-6.3 6-10.5Z" />
  </Icon>
);

export const WalkIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="13" cy="4.5" r="1.8" />
    <path d="M10 21l2.2-6-2.7-2.5 1-5 3.5 3 3 1M9.5 7.5L6.5 10v3M14.5 15.5l2 5.5" />
  </Icon>
);

export const WatchIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" rx="3.5" />
    <path d="M9 6l.8-3h4.4l.8 3M9 18l.8 3h4.4l.8-3M10 12h1.5l1-2 1 4 1-2" />
  </Icon>
);

export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p}>
    <path
      d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.7Z"
      fill={filled ? "currentColor" : "none"}
    />
  </Icon>
);

export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 5.7A9 9 0 0 1 12 5.5c5.5 0 9 6.5 9 6.5a15 15 0 0 1-2.4 3.1M6.4 7.4A15.6 15.6 0 0 0 3 12s3.5 6.5 9 6.5a8.6 8.6 0 0 0 4.4-1.2M4 4l16 16" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12s3.5-6.5 9-6.5 9 6.5 9 6.5-3.5 6.5-9 6.5S3 12 3 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Icon>
);

export const InfoIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Icon>
);

export const WifiOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 9a14 14 0 0 1 5-3M12 5.5a14 14 0 0 1 9.5 3.5M5.5 12.5a9 9 0 0 1 4-2.2M15 11a9 9 0 0 1 3.5 1.8M9 16a4.5 4.5 0 0 1 6 0M4 4l16 16" />
    <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const KIND_ICON = {
  meal: MealIcon,
  symptom: SymptomIcon,
  stress: StressIcon,
  sleep: SleepIcon,
} as const;
