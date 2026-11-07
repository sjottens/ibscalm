import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MOCK_ID, formatPrice } from "@/lib/payments/config";
import { activeProvider } from "@/lib/payments/server";
import { LogoMark } from "@/components/ui/logo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Simulated iDEAL checkout — only exists when the mock payment provider is active (never in production). */
export default async function MockCheckout({ params, searchParams }: PageProps<"/[locale]/betaling-test">) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (activeProvider() !== "mock") notFound();
  const id = String((await searchParams).id ?? "");
  if (!MOCK_ID.test(id)) notFound();
  const t = await getTranslations("reportPage");
  const href = (result: string) => `/api/checkout/mock?id=${encodeURIComponent(id)}&result=${result}&locale=${locale}`;

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-paper-deep px-5">
      <div className="paper-card w-full max-w-sm p-6 text-center">
        <LogoMark size={48} className="mx-auto" />
        <h1 className="mt-4 text-xl font-extrabold">{t("mockTitle")}</h1>
        <p className="mt-2 text-ink-soft">{t("mockBody")}</p>
        <p className="mt-4 text-3xl font-black">{formatPrice(locale)}</p>
        <div className="mt-6 grid gap-2">
          <a href={href("paid")} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent font-bold text-[#1b2b48]">
            {t("mockPaid")}
          </a>
          <a href={href("failed")} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line-strong font-semibold">
            {t("mockFailed")}
          </a>
        </div>
      </div>
    </main>
  );
}
