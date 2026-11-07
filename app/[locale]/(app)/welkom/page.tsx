import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Onboarding } from "@/components/app/onboarding";

export async function generateMetadata({ params }: PageProps<"/[locale]/welkom">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("label") };
}

export default async function Page({ params }: PageProps<"/[locale]/welkom">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Onboarding />;
}
