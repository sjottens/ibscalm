"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/controls";
import { EmptyIllustration } from "@/components/app/states";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <EmptyIllustration variant="plate" className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("body")}</p>
        <Button className="mt-6" onClick={reset}>
          {t("retry")}
        </Button>
      </div>
    </main>
  );
}
