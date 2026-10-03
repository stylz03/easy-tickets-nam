import type { Metadata } from "next";
import Link from "next/link";
import { CircleSlash } from "lucide-react";
import CheckoutShell from "@/components/checkout/CheckoutShell";
import OrderSummary from "@/components/checkout/OrderSummary";
import { FadeUp } from "@/components/checkout/Effects";
import type { TierId } from "@/data/events";
import { verifyRef } from "@/lib/orders";
import { amountCents, getOrderByRef } from "@/lib/orders-db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment cancelled | Easy Tickets", robots: { index: false } };

export default async function CancelledPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const sig = typeof sp.sig === "string" ? sp.sig : "";
  let order: { ref: string; e: number; i: [TierId, number][]; a: number } | null = null;
  if (verifyRef("receipt", ref, sig)) {
    const row = await getOrderByRef(ref).catch(() => null);
    if (row) {
      order = {
        ref: row.ref,
        e: row.event_id,
        i: row.items.map((it) => [it.tier, it.qty] as [TierId, number]),
        a: amountCents(row),
      };
    }
  }

  return (
    <CheckoutShell>
      <FadeUp className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <CircleSlash className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
          <p className="text-slate-500 text-sm mb-8">
            DPO reported that this payment was cancelled. If a charge appears, contact support with your order reference.
            {order && (
              <>
                {" "}Order <span className="font-mono font-semibold text-slate-800">{order.ref}</span> was not completed.
              </>
            )}
          </p>
        </div>
        {order && (
          <div className="mb-8">
            <OrderSummary eventId={order.e} items={order.i} amountCents={order.a} />
          </div>
        )}
        <Link
          href={order ? `/events/${order.e}` : "/design/1#events"}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all text-lg"
        >
          Try Again
        </Link>
      </FadeUp>
    </CheckoutShell>
  );
}
