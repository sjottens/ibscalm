import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app/app-shell";

// Health data lives here: keep these pages out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main id="main" className="min-h-dvh">
      <AppShell>{children}</AppShell>
    </main>
  );
}
