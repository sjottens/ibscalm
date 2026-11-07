import { NextResponse, type NextRequest } from "next/server";
import { completeMockPayment, PaymentError } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

/** Development/test only: finish a simulated payment and return to the report page, like Mollie would. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const result = url.searchParams.get("result") === "paid" ? "paid" : "failed";
  const prefix = url.searchParams.get("locale") === "en" ? "/en" : "";
  try {
    completeMockPayment(id, result);
  } catch (e) {
    return NextResponse.json({ error: "unknown_payment" }, { status: e instanceof PaymentError ? e.status : 500 });
  }
  return NextResponse.redirect(new URL(`${prefix}/rapport`, url.origin), 303);
}
