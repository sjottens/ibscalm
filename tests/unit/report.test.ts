import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ANALYSIS_CONFIG as cfg } from "@/lib/analysis";
import { buildReportModel, filterPeriod, periodStart } from "@/lib/report/model";
import { renderReportPdf } from "@/lib/report/pdf";
import { generateSeed } from "@/lib/seed/generate";
import { AppDatabase, setDbForTests } from "@/lib/db/database";
import { getSettings, saveMeal, updateSettings } from "@/lib/db/repo";
import { applyImport, buildExport, parseExport } from "@/lib/export";
import nl from "@/messages/nl.json";
import { at, input, key, meal, symptom } from "./fixtures";

const seed = generateSeed({ endDate: "2026-03-21", days: 21, seed: 42 });

describe("report model", () => {
  it("limits data to the chosen period", () => {
    const data = input({ meals: [meal(at(1, 12)), meal(at(10, 12)), meal(at(20, 12))] });
    expect(filterPeriod(data, key(10), key(20)).meals).toHaveLength(2);
    expect(periodStart(data, "14", key(20))).toBe(key(7));
    expect(periodStart(data, "all", key(20))).toBe(key(1));
  });

  it("summarises symptoms, stress and meals", () => {
    const m = buildReportModel(seed, cfg, "all", "2026-03-21", 0);
    expect(m.period).toEqual({ from: "2026-03-01", to: "2026-03-21", days: 21 });
    expect(m.symptoms.total).toBe(seed.symptoms.length);
    expect(m.symptoms.types[0].count).toBeGreaterThanOrEqual(m.symptoms.types.at(-1)!.count);
    expect(m.stress.total).toBe(seed.stress.length);
    expect(m.analysis.summary.topFoodTags[0]).toBe("onion-garlic");
  });

  it("handles an empty diary", () => {
    const m = buildReportModel(input({ symptoms: [symptom(at(2, 9), 3)] }), cfg, "14", key(2), 0);
    expect(m.symptoms.meanDailyMax).toBe(3);
    expect(m.symptoms.bristol).toEqual({});
  });
});

describe("report PDF", () => {
  it("renders a real PDF with the key sections", async () => {
    const model = buildReportModel(seed, cfg, "28", "2026-03-21", new Date(2026, 2, 21).getTime());
    const tr = nl.report as Record<string, string>;
    const t = (k: string, v?: Record<string, string | number>) =>
      Object.entries(v ?? {}).reduce((s, [a, b]) => s.replaceAll(`{${a}}`, String(b)), tr[k] ?? k);
    const bytes = await renderReportPdf(model, {
      t,
      tagLabel: (id) => (nl.tags as Record<string, string>)[id] ?? id,
      symptomLabel: (s) => (nl.symptomTypes as Record<string, string>)[s] ?? s,
      factorLabel: (f) => nl.insights.factor[f],
      confidenceLabel: (c) => (nl.insights.confidence as Record<string, string>)[c],
      locale: "nl",
      config: cfg,
    });
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(bytes.length).toBeGreaterThan(5_000);
    for (const s of ["Overzicht voor arts", "Samenvatting", "ui/knoflook", "Dagoverzicht", "geen medisch advies"]) {
      expect(text).toContain(s);
    }
  });
});

describe("purchases in backups", () => {
  beforeEach(() => setDbForTests(new AppDatabase(`report-${Math.random()}`)));

  it("restores an unlocked report on a new device", async () => {
    await saveMeal({ timestamp: at(1, 8), description: "x", tags: [], size: "normal" });
    await updateSettings({ purchases: { doctorReport: { paymentId: "tr_test123", paidAt: 1 } } });
    const text = JSON.stringify(await buildExport());

    setDbForTests(new AppDatabase(`report-new-${Math.random()}`));
    expect((await getSettings()).purchases.doctorReport).toBeUndefined();
    await applyImport(parseExport(text));
    expect((await getSettings()).purchases.doctorReport?.paymentId).toBe("tr_test123");
  });
});

describe("payment provider selection", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("uses the mock provider in development and never on Vercel production", async () => {
    const { activeProvider } = await import("@/lib/payments/server");
    process.env.PAYMENT_PROVIDER = "mock";
    expect(activeProvider()).toBe("mock");
    process.env.VERCEL_ENV = "production";
    expect(activeProvider()).toBeNull();
  });

  it("uses Mollie when an API key is configured", async () => {
    const { activeProvider } = await import("@/lib/payments/server");
    delete process.env.PAYMENT_PROVIDER;
    process.env.MOLLIE_API_KEY = "test_abc";
    expect(activeProvider()).toBe("mollie");
  });

  it("completes a simulated payment end to end", async () => {
    process.env.PAYMENT_PROVIDER = "mock";
    const { createPayment, getPaymentStatus, completeMockPayment } = await import("@/lib/payments/server");
    const { id, checkoutUrl } = await createPayment({ locale: "nl", origin: "http://x" });
    expect(checkoutUrl).toBe(`http://x/betaling-test?id=${id}`);
    expect(await getPaymentStatus(id)).toBe("open");
    completeMockPayment(id, "paid");
    expect(await getPaymentStatus(id)).toBe("paid");
    await expect(getPaymentStatus("tr_../../etc")).rejects.toThrow();
  });
});
