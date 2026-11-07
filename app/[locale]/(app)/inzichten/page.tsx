import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InsightsView } from "@/components/app/insights-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/inzichten">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("insights") };
}

export default async function Page({ params }: PageProps<"/[locale]/inzichten">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <InsightsView />;
}
