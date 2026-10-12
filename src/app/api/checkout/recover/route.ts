import { NextResponse } from "next/server";
import { REF_RE, signRef } from "@/lib/orders";
import { getOrderByRef } from "@/lib/orders-db";
import { settlePayment } from "@/lib/payment-settlement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ref = typeof body?.ref === "string" ? body.ref.trim().toUpperCase() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!REF_RE.test(ref) || !email || email.length > 254) return fail(400, "Enter a valid order reference and email address.");
    const order = await getOrderByRef(ref);
    // Keep lookup responses deliberately generic so the endpoint cannot be
    // used to enumerate orders by reference alone.
    if (!order || order.buyer_email.toLowerCase() !== email) return fail(404, "We could not find that guest booking.");
    const settled = order.status === "pending" && order.dpo_trans_token ? await settlePayment(order) : order;
    if (settled.status !== "paid") {
      return NextResponse.json({ ok: false, status: settled.status, error: "Payment is still being verified. Please try again in a few minutes." }, { status: 202, headers: { "Cache-Control": "no-store" } });
    }
    const sig = signRef("receipt", ref);
    return NextResponse.json({ ok: true, status: "paid", url: `/checkout/success?ref=${encodeURIComponent(ref)}&sig=${encodeURIComponent(sig)}` }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail(503, "Guest booking recovery is temporarily unavailable.");
  }
}
