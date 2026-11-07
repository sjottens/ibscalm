"use client";

import { MotionConfig, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ensureBuiltinTags } from "@/lib/db/repo";
import { useMounted, useSettings } from "@/lib/hooks/data";
import { cn } from "@/lib/cn";
import { useUi } from "@/lib/store/ui";
import { applyTheme } from "@/lib/theme";
import { InsightsIcon, SettingsIcon, TimelineIcon, TodayIcon } from "@/components/ui/icons";
import { SheetHost } from "@/components/entry/sheet-host";
import { ToastHost } from "@/components/ui/toast";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "@/components/marketing/mobile-menu";
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

  const onboardedThisSession = useUi((s) => s.onboardedThisSession);
  const needsOnboarding = settings && !settings.onboardingDone && !onWelcome && !onboardedThisSession;
  useEffect(() => {
    if (needsOnboarding) router.replace("/welkom");
  }, [needsOnboarding, router]);

  // The welcome screen needs no settings, so it can paint right away.
  if (!mounted || needsOnboarding || (!settings && !onWelcome)) return <PageLoading />;

  return (
    // Respect "reduce motion": springs become instant, layout animations are skipped.
    <MotionConfig reducedMotion="user">
      {!onWelcome ? <AppTopBar pathname={pathname} /> : null}
      <div className={cn("mx-auto w-full max-w-xl", !onWelcome && "pb-[calc(env(safe-area-inset-bottom)+5.5rem)]")}>{children}</div>
      {!onWelcome ? <BottomNav pathname={pathname} /> : null}
      <SheetHost />
      <ToastHost />
    </MotionConfig>
  );
}

/**
 * Slim top bar inside the app: the logo leads back to the website, the menu button opens
 * the same sections as on the website (how it works, about IBS, FAQ, privacy) plus the language.
 */
function AppTopBar({ pathname }: { pathname: string }) {
  const t = useTranslations("landing.nav");
  const locale = useLocale();
  const other = locale === "nl" ? "en" : "nl";
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-xl items-center justify-between px-3">
        <Link href="/" aria-label={`${BRAND.name} — ${t("home")}`} className="inline-flex min-h-11 items-center rounded-md px-1">
          <Logo size="sm" />
        </Link>
        <MobileMenu
          className=""
          items={[
            { href: "/#hoe-het-werkt", label: t("how") },
            { href: "/#over-pds", label: t("about") },
            { href: "/#vragen", label: t("faq") },
            { href: "/privacy", label: t("privacy") },
          ]}
          language={{ href: pathname, locale: other, label: other === "en" ? "English" : "Nederlands" }}
          labels={{ open: t("menu"), close: t("menuClose"), title: t("menuTitle") }}
        />
      </div>
    </header>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");
  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-md"
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
                    className="absolute top-1 h-8 w-14 rounded-full bg-paper-deep"
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
