"use client";

import { getSettings, updateSettings } from "@/lib/db/repo";
import type { PaymentStatus } from "./config";

/**
 * Starts the iDEAL checkout. The payment id is stored locally *before* redirecting,
 * because the provider does not pass it back — on return we look it up and confirm it.
 */
export async function startCheckout(locale: string): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
  });
  if (!res.ok) throw new Error(`checkout ${res.status}`);
  const { id, checkoutUrl } = (await res.json()) as { id: string; checkoutUrl: string };
  await updateSettings({ pendingPayment: { id, startedAt: Date.now() } });
  window.location.assign(checkoutUrl);
}

export async function fetchPaymentStatus(id: string): Promise<PaymentStatus> {
  const res = await fetch(`/api/checkout/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return ((await res.json()) as { status: PaymentStatus }).status;
}

export type PendingOutcome = "none" | "paid" | "open" | "failed" | "error";

/** Confirms a pending payment, if any, and unlocks the report when it was paid. */
export async function resolvePendingPayment(): Promise<PendingOutcome> {
  const settings = await getSettings();
  const pending = settings.pendingPayment;
  if (!pending) return "none";
  let status: PaymentStatus;
  try {
    status = await fetchPaymentStatus(pending.id);
  } catch {
    return "error";
  }
  if (status === "paid") {
    await updateSettings({
      purchases: { ...settings.purchases, doctorReport: { paymentId: pending.id, paidAt: Date.now() } },
      pendingPayment: null,
    });
    return "paid";
  }
  if (status === "open" || status === "pending" || status === "authorized") return "open";
  await updateSettings({ pendingPayment: null });
  return "failed";
}
