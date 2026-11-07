"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ensureBuiltinTags } from "@/lib/db/repo";
import { useMounted, useSettings } from "@/lib/hooks/data";
import { cn } from "@/lib/cn";
import { applyTheme } from "@/lib/theme";
import { InsightsIcon, SettingsIcon, TimelineIcon, TodayIcon } from "@/components/ui/icons";
import { SheetHost } from "@/components/entry/sheet-host";
import { ToastHost } from "@/components/ui/toast";
import { PageLoading } from "./states";

const NAV = [
  { href: "/vandaag", key: "today", Icon: TodayIcon },
  { href: "/tijdlijn", key: "timeline", Icon: TimelineIcon },
  { href: "/inzichten", key: "insights", Icon: InsightsIcon },
  { href: "/instellingen", key: "settings", Icon: SettingsIcon },
] as const;

/**
 * Wraps all app screens: loads settings, sends first-time users to onboarding,
 * renders the bottom navigation, entry sheets and toasts.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const settings = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const onWelcome = pathname.startsWith("/welkom");

  useEffect(() => {
    void ensureBuiltinTags();
  }, []);

  useEffect(() => {
    if (settings) applyTheme(settings.theme);
  }, [settings]);

  const needsOnboarding = settings && !settings.onboardingDone && !onWelcome;
  useEffect(() => {
    if (needsOnboarding) router.replace("/welkom");
  }, [needsOnboarding, router]);

  if (!mounted || !settings || needsOnboarding) return <PageLoading />;

  return (
    <>
      <div className={cn("mx-auto w-full max-w-xl", !onWelcome && "pb-[calc(env(safe-area-inset-bottom)+5.5rem)]")}>{children}</div>
      {!onWelcome ? <BottomNav pathname={pathname} /> : null}
      <SheetHost />
      <ToastHost />
    </>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-line bg-paper/92 backdrop-blur-md"
    >
      <ul className="pb-safe mx-auto grid max-w-xl grid-cols-4 px-2 pt-1.5">
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[0.72rem] font-semibold transition-colors",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute top-1 h-8 w-14 rounded-full bg-stress"
                    transition={{ type: "spring", stiffness: 500, damping: 34 }}
                  />
                ) : null}
                <Icon size={22} className="relative" />
                <span className="relative">{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
