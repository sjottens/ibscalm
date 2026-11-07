import type { jsPDF as JsPDF } from "jspdf";
import { formatDayShort, percent } from "@/lib/format";
import { shrink, type AnalysisConfig, type Factor, type RateComparison, type TagEffect } from "@/lib/analysis";
import { BRAND } from "@/lib/brand";
import type { ReportModel } from "./model";

/** Translation function for the "report" namespace (next-intl compatible). */
export type ReportT = (key: string, values?: Record<string, string | number>) => string;

export interface RenderOptions {
  t: ReportT;
  tagLabel: (id: string) => string;
  symptomLabel: (type: string) => string;
  factorLabel: (f: Factor) => string;
  confidenceLabel: (c: string) => string;
  locale: string;
  config: AnalysisConfig;
}

const NAVY: [number, number, number] = [27, 43, 72];
const SOFT: [number, number, number] = [74, 90, 117];
const LINE: [number, number, number] = [221, 227, 235];
const ROSE: [number, number, number] = [240, 124, 155];
const WASH: [number, number, number] = [242, 245, 249];

/**
 * Renders the doctor's report as a PDF, entirely on the device.
 * jsPDF is loaded on demand so it never weighs on normal page loads.
 */
export async function renderReportPdf(model: ReportModel, o: RenderOptions): Promise<Uint8Array> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 16;
  const { t, locale } = o;
  const a = model.analysis;
  const s = a.summary;
  let y = 0;

  const fmtDate = (d: string) => formatDayShort(d, locale);
  const num = (v: number | null, digits = 1) => (v === null ? "–" : v.toFixed(digits).replace(".", locale === "nl" ? "," : "."));

  // ── Header band ──────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(t("title"), M, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${BRAND.name} · ${t("subtitle")}`, M, 22);
  y = 38;

  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.text(t("period", { from: fmtDate(model.period.from), to: fmtDate(model.period.to), days: model.period.days }), M, y);
  doc.setTextColor(...SOFT);
  doc.text(t("generated", { date: new Date(model.generatedAt).toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB") }), W - M, y, { align: "right" });
  y += 6;

  // ── Disclaimer box ───────────────────────────────────────────────────
  doc.setFillColor(...WASH);
  doc.setDrawColor(...LINE);
  const disclaimer = doc.splitTextToSize(t("disclaimer", { brand: BRAND.name }), W - 2 * M - 8);
  const boxH = disclaimer.length * 4.6 + 6;
  doc.roundedRect(M, y, W - 2 * M, boxH, 2, 2, "FD");
  doc.setTextColor(...NAVY);
  doc.setFontSize(9.5);
  doc.text(disclaimer, M + 4, y + 6);
  y += boxH + 8;

  const heading = (text: string) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, M, y);
    doc.setDrawColor(...LINE);
    doc.line(M, y + 2, W - M, y + 2);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };
  const paragraph = (text: string, color: [number, number, number] = NAVY) => {
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - 2 * M);
    doc.text(lines, M, y);
    y += lines.length * 4.8 + 2;
  };
  const table = (head: string[], body: (string | number)[][]) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body: body.map((r) => r.map(String)),
      margin: { left: M, right: M },
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, textColor: NAVY, lineColor: LINE, lineWidth: 0.2, cellPadding: 2 },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 251, 253] },
    });
    y = (doc as JsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  };

  // ── Summary ──────────────────────────────────────────────────────────
  heading(t("summaryTitle"));
  doc.setFont("helvetica", "bold");
  if (s.status === "found") paragraph(t("summaryFound", { factors: s.factors.map(o.factorLabel).join(", ") }));
  else paragraph(t("summaryUnclear"));
  doc.setFont("helvetica", "normal");
  if (s.status === "collecting") paragraph(t("summaryCollecting", { min: s.minDays }), SOFT);
  if (s.factors.includes("food") && s.topFoodTags.length) paragraph(t("summaryFood", { tags: s.topFoodTags.map(o.tagLabel).join(", ") }));
  paragraph(t("confidence", { label: o.confidenceLabel(s.confidence) }), SOFT);
  paragraph(
    t("counts", { days: s.daysTracked, meals: s.counts.meals, symptoms: s.counts.symptoms, stress: s.counts.stress }),
    SOFT,
  );
  y += 2;

  // ── Symptoms ─────────────────────────────────────────────────────────
  heading(t("symptomsTitle"));
  table(
    [t("colMeasure"), t("colValue")],
    [
      [t("daysWithSymptoms"), `${model.symptoms.daysWithSymptoms} / ${s.daysTracked}`],
      [t("meanDailyMax"), num(model.symptoms.meanDailyMax)],
      [t("commonTypes"), model.symptoms.types.slice(0, 5).map((x) => `${o.symptomLabel(x.type)} (${x.count}×)`).join(", ") || t("none")],
      [
        t("bristol"),
        Object.keys(model.symptoms.bristol).length
          ? Object.entries(model.symptoms.bristol)
              .sort(([x], [z]) => Number(x) - Number(z))
              .map(([k, v]) => `${t("bristolType", { type: k })}: ${v}×`)
              .join(", ")
          : t("none"),
      ],
    ],
  );

  // Daily max-severity bar chart (one bar per tracked day).
  if (a.days.length) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(t("chartTitle"), M, y);
    y += 4;
    const chartH = 30;
    const chartW = W - 2 * M;
    const n = a.days.length;
    const step = chartW / n;
    const bw = Math.max(0.8, step * 0.7);
    doc.setDrawColor(...LINE);
    for (const v of [0, 5, 10]) doc.line(M, y + chartH - (v / 10) * chartH, M + chartW, y + chartH - (v / 10) * chartH);
    doc.setFillColor(...ROSE);
    a.days.forEach((d, i) => {
      const h = (d.maxSeverity / 10) * chartH;
      if (h > 0) doc.rect(M + i * step + (step - bw) / 2, y + chartH - h, bw, h, "F");
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SOFT);
    doc.text("10", M - 1, y + 1.5, { align: "right" });
    doc.text("0", M - 1, y + chartH + 1, { align: "right" });
    doc.text(fmtDate(a.days[0].date), M, y + chartH + 5);
    doc.text(fmtDate(a.days[n - 1].date), M + chartW, y + chartH + 5, { align: "right" });
    y += chartH + 12;
  }

  // ── Food ─────────────────────────────────────────────────────────────
  heading(t("foodTitle"));
  paragraph(t("foodIntro", { threshold: o.config.severityThreshold, min: o.config.food.minHours, max: o.config.food.maxHours }), SOFT);
  // Same ordering as the app: effect weighted by sample size; too-small groups last and marked.
  const few = (x: TagEffect) => x.exposed.n < o.config.food.minMeals;
  const score = (x: TagEffect) => (few(x) ? -1 : shrink(x.difference ?? 0, x.exposed.n, o.config));
  const foodRows = a.food.tags
    .filter((x) => x.exposed.n > 0 && x.reference.n > 0)
    .sort((x, z) => score(z) - score(x))
    .slice(0, 12);
  if (foodRows.length) {
    table(
      [t("colTag"), t("colMeals"), t("colWith"), t("colWithout"), t("colDiff")],
      foodRows.map((r) => [
        few(r) ? `${o.tagLabel(r.tag)} *` : o.tagLabel(r.tag),
        r.exposed.n,
        percent(r.exposed.rate),
        percent(r.reference.rate),
        r.difference === null ? "–" : `${r.difference > 0 ? "+" : ""}${Math.round(r.difference * 100)}%`,
      ]),
    );
    if (foodRows.some(few)) {
      y -= 4;
      doc.setFontSize(8.5);
      paragraph(t("fewNote", { min: o.config.food.minMeals }), SOFT);
      doc.setFontSize(10);
      y += 2;
    }
  } else paragraph(t("none"), SOFT);

  // ── Stress ───────────────────────────────────────────────────────────
  heading(t("stressTitle"));
  paragraph(t("stressIntro", { hours: o.config.stress.afterHours }), SOFT);
  const rateRow = (label: string, c: RateComparison) => [label, percent(c.exposed.rate), `${c.exposed.hits}/${c.exposed.n}`];
  table(
    [t("colGroup"), t("colRate"), t("colN")],
    [
      rateRow(t("rowAfterStress"), a.stress.all),
      rateRow(t("rowAnticipatory"), a.stress.anticipatory),
      [t("rowOther"), percent(a.stress.all.reference.rate), String(a.stress.referenceMoments)],
    ],
  );
  table(
    [t("colGroup"), t("colMeanMax"), t("colDays")],
    [
      [t("highStressDays"), num(a.stressDays.exposed.mean), a.stressDays.exposed.n],
      [t("lowStressDays"), num(a.stressDays.reference.mean), a.stressDays.reference.n],
    ],
  );

  // ── Sleep & late eating ──────────────────────────────────────────────
  heading(t("sleepTitle"));
  table(
    [t("colGroup"), t("colMeanMax"), t("colDays")],
    [
      [t("poorSleep"), num(a.sleepDays.exposed.mean), a.sleepDays.exposed.n],
      [t("goodSleep"), num(a.sleepDays.reference.mean), a.sleepDays.reference.n],
    ],
  );
  heading(t("lateTitle", { hour: o.config.lateEating.hour }));
  table(
    [t("colGroup"), t("colRate"), t("colN")],
    [rateRow(t("lateRow"), a.lateEating), [t("otherEvenings"), percent(a.lateEating.reference.rate), `${a.lateEating.reference.hits}/${a.lateEating.reference.n}`]],
  );

  // ── Daily overview ───────────────────────────────────────────────────
  heading(t("dailyTitle"));
  table(
    [t("colDate"), t("colMaxSeverity"), t("colStress"), t("colSleep"), t("colMealsDay")],
    a.days.map((d) => [fmtDate(d.date), d.symptomCount ? d.maxSeverity : "–", d.maxStress || "–", d.sleepQuality ?? "–", d.mealCount]),
  );

  // ── Notes for the appointment ────────────────────────────────────────
  heading(t("notesTitle"));
  doc.setDrawColor(...LINE);
  for (let i = 0; i < 6; i++) {
    if (y > 280) break;
    y += 8;
    doc.line(M, y, W - M, y);
  }

  // ── Footer on every page ─────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...SOFT);
    doc.text(t("footer", { brand: BRAND.name }), M, 290);
    doc.text(t("page", { page: p, pages }), W - M, 290, { align: "right" });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
