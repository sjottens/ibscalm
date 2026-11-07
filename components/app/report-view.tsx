"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useAnalysis, useSettings, useTagLabel, useToday } from "@/lib/hooks/data";
import { buildReportModel, type ReportPeriod } from "@/lib/report/model";
import { formatPrice } from "@/lib/payments/config";
import { resolvePendingPayment, startCheckout, type PendingOutcome } from "@/lib/payments/client";
import { useUi } from "@/lib/store/ui";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/controls";
import { CheckIcon, DownloadIcon, InfoIcon, LockIcon } from "@/components/ui/icons";
import { Skeleton } from "./states";

const INCLUDES = ["summary", "symptoms", "food", "stress", "daily"] as const;

export function ReportView() {
  const t = useTranslations("reportPage");
  const tr = useTranslations("report");
  const tAll = useTranslations();
  const locale = useLocale();
  const settings = useSettings();
  const data = useAnalysis();
  const today = useToday();
  const tagLabel = useTagLabel();
  const showToast = useUi((s) => s.showToast);
  const [outcome, setOutcome] = useState<PendingOutcome | "checking">("none");
  const [busy, setBusy] = useState<"pay" | "pdf" | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>("28");
  const checked = useRef(false);

  // Coming back from iDEAL: confirm the pending payment once.
  const hasPending = Boolean(settings?.pendingPayment);
  useEffect(() => {
    if (!hasPending || checked.current) return;
    checked.current = true;
    let cancelled = false;
    queueMicrotask(() => !cancelled && setOutcome("checking"));
    void resolvePendingPayment().then((r) => {
      if (cancelled) return;
      setOutcome(r);
      if (r === "paid") showToast({ message: t("paid"), tone: "stamp" });
    });
    return () => {
      cancelled = true;
    };
  }, [hasPending, showToast, t]);

  if (!settings || !data) {
    return (
      <div className="space-y-4 px-4 pt-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const purchase = settings.purchases.doctorReport;
  const hasData = data.result.summary.daysTracked > 0;

  const pay = async () => {
    setBusy("pay");
    try {
      await startCheckout(locale);
    } catch {
      setBusy(null);
      showToast({ message: t("error"), tone: "error" });
    }
  };

  const download = async () => {
    setBusy("pdf");
    try {
      const model = buildReportModel(data.input, data.config, period, today);
      const { renderReportPdf } = await import("@/lib/report/pdf");
      const bytes = await renderReportPdf(model, {
        t: (key, values) => tr(key as never, values as never),
        tagLabel,
        symptomLabel: (type) => tAll(`symptomTypes.${type}` as never),
        factorLabel: (f) => tAll(`insights.factor.${f}` as never),
        confidenceLabel: (c) => tAll(`insights.confidence.${c}` as never),
        locale,
        config: data.config,
      });
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ibscalm-rapport-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast({ message: t("downloaded"), tone: "stamp" });
    } catch {
      showToast({ message: tAll("errors.title"), tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 px-4 pb-10 pt-5">
      <header>
        <h1 className="text-[2.1rem] font-black leading-tight">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("lead")}</p>
      </header>

      {outcome !== "none" && outcome !== "paid" ? (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-lg p-3.5 text-[0.95rem]",
            outcome === "failed" || outcome === "error" ? "bg-danger-wash text-danger" : "bg-paper-deep",
          )}
        >
          <InfoIcon size={20} className="mt-0.5 shrink-0" />
          {outcome === "checking" ? t("checking") : outcome === "open" ? t("open") : outcome === "failed" ? t("failed") : t("error")}
        </p>
      ) : null}

      {purchase ? (
        <section className="paper-card border-l-4 border-l-food p-5" aria-labelledby="unlocked-title">
          <h2 id="unlocked-title" className="flex items-center gap-2 text-xl font-extrabold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-food-wash text-food-ink">
              <CheckIcon size={16} strokeWidth={3} />
            </span>
            {t("unlocked")}
          </h2>
          <p className="mt-1 text-ink-soft">{t("unlockedBody")}</p>

          {hasData ? (
            <>
              <fieldset className="mt-4">
                <legend className="mb-2 font-bold">{t("periodLabel")}</legend>
                <div role="radiogroup" aria-label={t("periodLabel")} className="grid grid-cols-3 gap-1.5">
                  {(["14", "28", "all"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={period === p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "min-h-12 rounded-lg border px-2 text-[0.95rem] font-semibold",
                        period === p ? "border-transparent bg-ink text-paper" : "border-line-strong bg-card hover:border-ink-soft",
                      )}
                    >
                      {t(p === "14" ? "period14" : p === "28" ? "period28" : "periodAll")}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Button variant="spot" size="lg" className="mt-4 w-full" icon={<DownloadIcon size={20} />} onClick={download} disabled={busy === "pdf"}>
                {busy === "pdf" ? t("generating") : t("download")}
              </Button>
            </>
          ) : (
            <p className="mt-4 rounded-lg bg-paper-deep p-3.5">{t("noData")}</p>
          )}
          <p className="mt-3 text-sm text-ink-soft">{t("receipt", { id: purchase.paymentId })}</p>
        </section>
      ) : (
        <section className="paper-card p-5" aria-labelledby="buy-title">
          <h2 id="buy-title" className="text-xl font-extrabold">
            {t("includesTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {INCLUDES.map((k) => (
              <li key={k} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-food-wash text-food-ink">
                  <CheckIcon size={14} strokeWidth={3} />
                </span>
                {t(`includes.${k}`)}
              </li>
            ))}
          </ul>
          {!hasData ? <p className="mt-4 rounded-lg bg-stress-wash p-3.5 text-[0.95rem] text-stress-ink">{t("noDataYet")}</p> : null}
          <div className="perforation my-5" />
          <p className="text-3xl font-black">{t("price", { price: formatPrice(locale) })}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("priceNote")}</p>
          <Button variant="spot" size="lg" className="mt-4 w-full" onClick={pay} disabled={busy === "pay" || outcome === "checking"}>
            <IdealMark />
            {busy === "pay" ? t("redirecting") : t("payIdeal")}
          </Button>
          <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
            <LockIcon size={18} className="mt-0.5 shrink-0" />
            {t("privacyNote")}
          </p>
        </section>
      )}

      <p className="flex gap-2 rounded-lg bg-paper-deep p-3.5 text-sm text-ink-soft">
        <InfoIcon size={20} className="mt-px shrink-0 text-ink" />
        {t("disclaimer")}
      </p>
    </div>
  );
}

/** Small neutral "iDEAL" badge (text only; the official logo can be swapped in later). */
function IdealMark() {
  return (
    <span aria-hidden className="rounded bg-white px-1.5 py-0.5 text-xs font-black tracking-tight text-[#cc0066] ring-1 ring-black/10">
      iDEAL
    </span>
  );
}
