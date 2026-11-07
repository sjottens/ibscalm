import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WifiOffIcon } from "@/components/ui/icons";

export const metadata: Metadata = { robots: { index: false } };

/** Served by the service worker when a page that was never cached is opened offline. */
export default async function OfflinePage({ params }: PageProps<"/[locale]/offline">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offline");
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-[2px] border-ink bg-sleep">
          <WifiOffIcon size={36} />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("body")}</p>
        <Link href="/vandaag" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-ink px-5 font-semibold text-paper">
          {t("action")}
        </Link>
      </div>
    </main>
  );
}
