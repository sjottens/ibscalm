import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReportView } from "@/components/app/report-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/rapport">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reportPage" });
  return { title: t("title") };
}

export default async function Page({ params }: PageProps<"/[locale]/rapport">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReportView />;
}
