import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import CheckoutShell from "@/components/checkout/CheckoutShell";
import { FadeUp } from "@/components/checkout/Effects";
import { VERIFY_CODES_PUBLIC } from "@/components/checkout/reasons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment not completed | Easy Tickets", robots: { index: false } };

export default async function FailedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const reason = typeof sp.reason === "string" ? sp.reason : "";
  const ref = typeof sp.ref === "string" && /^ET-\d{8}-[0-9A-F]{8}$/.test(sp.ref) ? sp.ref : null;
  const message = VERIFY_CODES_PUBLIC[reason] ?? "Your payment could not be completed.";

  return (
    <CheckoutShell>
      <FadeUp className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Completed</h1>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        {ref && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8 text-sm">
            <div className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-1">Order reference</div>
            <div className="font-mono font-semibold text-slate-800">{ref}</div>
          </div>
        )}
        <p className="text-xs text-slate-400 mb-8">Tickets appear after payment is confirmed. If you were charged, check My tickets or contact support with your order reference.</p>
        <Link
          href="/design/1#events"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all text-lg"
        >
          Try Again
        </Link>
      </FadeUp>
    </CheckoutShell>
  );
}
