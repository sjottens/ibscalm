import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EmptyIllustration } from "@/components/app/states";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <EmptyIllustration variant="day" className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-extrabold">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-ink-soft">{t("notFoundBody")}</p>
        <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-ink px-5 font-semibold text-paper">
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
