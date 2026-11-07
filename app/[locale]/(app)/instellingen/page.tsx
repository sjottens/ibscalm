import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SettingsView } from "@/components/app/settings-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/instellingen">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("settings") };
}

export default async function Page({ params }: PageProps<"/[locale]/instellingen">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsView />;
}
