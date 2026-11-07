import { NextResponse } from "next/server";
import { getPaymentStatus, PaymentError } from "@/lib/payments/server";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Returns the status of a payment (open / paid / failed / …). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const status = await getPaymentStatus(id);
    return NextResponse.json({ status }, { headers: noStore });
  } catch (e) {
    const code = e instanceof PaymentError ? e.status : 500;
    return NextResponse.json({ error: "status_failed" }, { status: code, headers: noStore });
  }
}
