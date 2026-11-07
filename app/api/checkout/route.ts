import { NextResponse, type NextRequest } from "next/server";
import { createPayment, PaymentError } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Starts an iDEAL payment for the doctor's report. The request body carries only the language. */
export async function POST(req: NextRequest) {
  let locale: "nl" | "en" = "nl";
  try {
    const body = (await req.json()) as { locale?: string };
    if (body.locale === "en") locale = "en";
  } catch {
    // empty body: default language
  }
  try {
    const origin = new URL(req.url).origin;
    const payment = await createPayment({ locale, origin });
    return NextResponse.json(payment, { headers: noStore });
  } catch (e) {
    const status = e instanceof PaymentError ? e.status : 500;
    return NextResponse.json({ error: "checkout_failed" }, { status, headers: noStore });
  }
}
