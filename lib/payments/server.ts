import "server-only";
import { randomUUID } from "node:crypto";
import { BRAND } from "@/lib/brand";
import { MOCK_ID, MOLLIE_ID, REPORT_PRICE_EUR, REPORT_PRODUCT, type PaymentStatus } from "./config";

/**
 * Server side of the iDEAL payment for the doctor's report.
 * Only payment data passes through here — never any health data.
 *
 * Provider selection:
 * - PAYMENT_PROVIDER=mollie (or MOLLIE_API_KEY set): real payments via Mollie.
 * - PAYMENT_PROVIDER=mock: simulated payments for development and tests. Refused on Vercel production.
 */

export type Provider = "mollie" | "mock";

export class PaymentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function activeProvider(): Provider | null {
  const explicit = process.env.PAYMENT_PROVIDER;
  const isProd = process.env.VERCEL_ENV === "production";
  if (explicit === "mock") return isProd ? null : "mock";
  if (explicit === "mollie" || process.env.MOLLIE_API_KEY) return process.env.MOLLIE_API_KEY ? "mollie" : null;
  return process.env.NODE_ENV !== "production" || process.env.PAYMENT_PROVIDER_FALLBACK === "mock" ? "mock" : null;
}

const MOLLIE_API = "https://api.mollie.com/v2";

async function mollie<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MOLLIE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new PaymentError(502, `Mollie responded ${res.status}`);
  return (await res.json()) as T;
}

interface MolliePayment {
  id: string;
  status: PaymentStatus;
  amount: { value: string; currency: string };
  metadata?: { product?: string } | null;
  _links: { checkout?: { href: string } };
}

// Mock payments live in memory (shared via globalThis, because route handlers can be bundled separately).
// Fine for `next dev` / `next start` / tests; never used in production.
const g = globalThis as typeof globalThis & { __ibscalmMockPayments?: Map<string, PaymentStatus> };
const mockStore = (g.__ibscalmMockPayments ??= new Map<string, PaymentStatus>());

export async function createPayment(opts: { locale: "nl" | "en"; origin: string }): Promise<{ id: string; checkoutUrl: string }> {
  const provider = activeProvider();
  if (!provider) throw new PaymentError(503, "Payments are not configured");
  const prefix = opts.locale === "nl" ? "" : "/en";
  const redirectUrl = `${opts.origin}${prefix}/rapport`;

  if (provider === "mock") {
    const id = `mock_${randomUUID()}`;
    mockStore.set(id, "open");
    return { id, checkoutUrl: `${opts.origin}${prefix}/betaling-test?id=${id}` };
  }

  const payment = await mollie<MolliePayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: { currency: "EUR", value: REPORT_PRICE_EUR },
      description: opts.locale === "nl" ? `${BRAND.name} – rapport voor je arts` : `${BRAND.name} – report for your doctor`,
      redirectUrl,
      method: "ideal",
      locale: opts.locale === "nl" ? "nl_NL" : "en_GB",
      metadata: { product: REPORT_PRODUCT },
    }),
  });
  const checkoutUrl = payment._links.checkout?.href;
  if (!checkoutUrl) throw new PaymentError(502, "No checkout URL");
  return { id: payment.id, checkoutUrl };
}

/** Returns the payment status; "paid" only when amount and product match what we sell. */
export async function getPaymentStatus(id: string): Promise<PaymentStatus> {
  const provider = activeProvider();
  if (!provider) throw new PaymentError(503, "Payments are not configured");

  if (provider === "mock") {
    if (!MOCK_ID.test(id)) throw new PaymentError(400, "Invalid payment id");
    const status = mockStore.get(id);
    if (!status) throw new PaymentError(404, "Unknown payment");
    return status;
  }

  if (!MOLLIE_ID.test(id)) throw new PaymentError(400, "Invalid payment id");
  const p = await mollie<MolliePayment>(`/payments/${encodeURIComponent(id)}`);
  if (p.status === "paid") {
    const valid = p.amount.currency === "EUR" && p.amount.value === REPORT_PRICE_EUR && p.metadata?.product === REPORT_PRODUCT;
    if (!valid) throw new PaymentError(409, "Payment does not match this product");
  }
  return p.status;
}

/** Mock only: complete a simulated payment. */
export function completeMockPayment(id: string, result: "paid" | "failed"): void {
  if (activeProvider() !== "mock" || !MOCK_ID.test(id) || !mockStore.has(id)) throw new PaymentError(404, "Unknown payment");
  mockStore.set(id, result === "paid" ? "paid" : "failed");
}
