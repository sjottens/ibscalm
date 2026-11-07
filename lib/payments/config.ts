/** Shared (client + server) payment settings. */

export const REPORT_PRODUCT = "doctor-report" as const;

/** Price in euros as a decimal string, e.g. "4.99". Public, so the client can show it. */
export const REPORT_PRICE_EUR = (process.env.NEXT_PUBLIC_REPORT_PRICE_EUR ?? "4.99").trim();

export function formatPrice(locale: string): string {
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-GB", { style: "currency", currency: "EUR" }).format(Number(REPORT_PRICE_EUR));
}

export type PaymentStatus = "open" | "pending" | "authorized" | "paid" | "canceled" | "expired" | "failed";

export const MOLLIE_ID = /^tr_[A-Za-z0-9]{4,40}$/;
export const MOCK_ID = /^mock_[a-z0-9-]{8,64}$/;
