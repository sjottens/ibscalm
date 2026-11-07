import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TodayView } from "@/components/app/today-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/vandaag">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("today") };
}

export default async function Page({ params }: PageProps<"/[locale]/vandaag">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TodayView />;
}
