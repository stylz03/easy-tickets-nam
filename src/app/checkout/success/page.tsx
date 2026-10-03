import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import CheckoutShell from "@/components/checkout/CheckoutShell";
import OrderSummary, { formatMoney } from "@/components/checkout/OrderSummary";
import { AnimatedCheckmark, Confetti, FadeUp } from "@/components/checkout/Effects";
import { getEvent, getTier, type TierId } from "@/data/events";
import { verifyRef } from "@/lib/orders";
import { amountCents, getOrderByRef, type OrderRow } from "@/lib/orders-db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking confirmed | Easy Tickets", robots: { index: false } };

function bars(seed: string) {
  // deterministic "barcode" from the order ref
  let h = 2166136261;
  return Array.from({ length: 40 }, (_, i) => {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    return { w: h % 2 ? 3 : 2, o: 0.6 + ((h >> 3) % 40) / 100 };
  });
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const sig = typeof sp.sig === "string" ? sp.sig : "";
  // The link is HMAC-signed by /api/dpo/return, so refs can't be enumerated.
  // The order itself (and its paid status) is read from the database.
  let order: OrderRow | null = null;
  if (verifyRef("receipt", ref, sig)) {
    try {
      order = await getOrderByRef(ref);
    } catch (e) {
      console.error("[checkout/success] order lookup failed", ref, (e as Error).message);
    }
  }
  const event = order ? getEvent(order.event_id) : undefined;
  const receipt =
    order && order.status === "paid"
      ? {
          ref: order.ref,
          e: order.event_id,
          i: order.items.map((it) => [it.tier, it.qty] as [TierId, number]),
          a: amountCents(order),
          ap: order.dpo_approval || order.dpo_trans_ref || undefined,
          name: order.buyer_name,
          email: order.buyer_email,
        }
      : null;

  if (!receipt || !event) {
    return (
      <CheckoutShell>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">We couldn&apos;t find that booking</h1>
          <p className="text-slate-500 text-sm mb-8">This confirmation link is invalid. If you were charged, contact support with your payment reference.</p>
          <Link href="/design/1#events" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-200 transition-all">
            Back to events
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  const tierNames = receipt.i.map(([t]) => getTier(event, t)?.name ?? t).join(" / ");
  const qty = receipt.i.reduce((s, [, q]) => s + q, 0);

  return (
    <CheckoutShell>
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
        <Confetti />
        <div className="text-center mb-8 relative z-20">
          <AnimatedCheckmark />
          <FadeUp delay={0.6}>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
            <p className="text-slate-500 text-sm">
              Payment verified with DPO Pay. Your order reference is{" "}
              <span className="font-mono font-semibold text-slate-800">{receipt.ref}</span>.
            </p>
          </FadeUp>
        </div>

        {/* Digital ticket */}
        <FadeUp delay={0.8} className="relative z-20">
          <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <Logo dark size="sm" />
                <span className="text-xs font-mono opacity-80">#{receipt.ref}</span>
              </div>
            </div>
            <div className="flex justify-between -my-3 px-0 relative z-10">
              <div className="w-6 h-6 bg-white rounded-full -ml-3 border-r-2 border-slate-100" />
              <div className="flex-1 border-b-2 border-dashed border-slate-200 self-center mx-1" />
              <div className="w-6 h-6 bg-white rounded-full -mr-3 border-l-2 border-slate-100" />
            </div>
            <div className="p-5 pt-6">
              <h3 className="font-bold text-slate-900 text-lg mb-3">{event.title}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                {[
                  ["Date", event.fullDate],
                  ["Time", event.time],
                  ["Venue", event.location.split(",")[0]],
                  ["Tier", tierNames],
                  ["Tickets", String(qty)],
                  ["Paid", formatMoney(receipt.a)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-slate-400 text-xs uppercase tracking-wider font-medium">{k}</div>
                    <div className="text-slate-800 font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col items-center">
                <div className="flex gap-[2px] h-14">
                  {bars(receipt.ref).map((b, i) => (
                    <div key={i} className="bg-slate-800 rounded-sm" style={{ width: b.w, height: "100%", opacity: b.o }} />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 font-mono tracking-widest">{receipt.ref.replace(/-/g, "")}</span>
              </div>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={1.0} className="relative z-20 mt-8 space-y-6">
          <OrderSummary eventId={receipt.e} items={receipt.i} amountCents={receipt.a} />
          {receipt.name && (
            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <Mail className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="text-sm text-blue-700 font-medium">
                Booked by {receipt.name} ({receipt.email})
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified server-side with DPO Pay{receipt.ap ? ` · Ref ${receipt.ap}` : ""} · Sandbox test transaction
          </div>
          <Link
            href="/design/1#events"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all text-lg"
          >
            Done
          </Link>
        </FadeUp>
      </div>
    </CheckoutShell>
  );
}
