import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TimelineView } from "@/components/app/timeline-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/tijdlijn">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("timeline") };
}

export default async function Page({ params }: PageProps<"/[locale]/tijdlijn">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TimelineView />;
}
