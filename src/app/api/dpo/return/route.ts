import { NextResponse, type NextRequest } from "next/server";
import { toCents, verifyToken } from "@/lib/dpo";
import { ORDER_COOKIE, sign, unsign, type OrderCookie, type OrderPayload, type ReceiptPayload } from "@/lib/orders";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * DPO RedirectURL + BackURL handler.
 *
 * DPO appends TransactionToken / TransID / CompanyRef to the URL. None of
 * these are trusted on their own: the order details come from our HMAC-signed
 * `o` param, and payment status ALWAYS comes from a server-side verifyToken
 * call, with amount + currency checked against the signed order.
 */
export async function GET(req: NextRequest) {
  const base = siteUrl(req);
  const q = req.nextUrl.searchParams;
  const isBack = q.get("back") === "1";

  const go = (path: string, params: Record<string, string>) => {
    const u = new URL(path, base);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const r = NextResponse.redirect(u, 303);
    r.headers.set("Cache-Control", "no-store");
    return r;
  };

  const order = unsign<OrderPayload>("order", q.get("o"));
  if (!order) return go("/checkout/failed", { reason: "invalid_order" });

  const companyRef = q.get("CompanyRef");
  if (companyRef && companyRef !== order.ref) {
    return go("/checkout/failed", { reason: "mismatch", ref: order.ref });
  }

  const cookie = unsign<OrderCookie>("cookie", req.cookies.get(ORDER_COOKIE)?.value);
  const boundCookie = cookie && cookie.ref === order.ref ? cookie : null;

  // Token: from DPO's redirect params, or (BackURL / missing param) from our signed cookie.
  const qToken = q.get("TransactionToken") || q.get("TransID") || "";
  if (qToken && boundCookie && boundCookie.tok !== qToken) {
    return go("/checkout/failed", { reason: "mismatch", ref: order.ref });
  }
  const transToken = qToken || boundCookie?.tok || "";
  if (!transToken || !/^[A-Za-z0-9-]{8,64}$/.test(transToken)) {
    return isBack
      ? go("/checkout/cancelled", { o: q.get("o")! })
      : go("/checkout/failed", { reason: "missing_token", ref: order.ref });
  }

  let v: Awaited<ReturnType<typeof verifyToken>>;
  try {
    v = await verifyToken(transToken);
  } catch (e) {
    console.error("[dpo/return] verifyToken request failed", order.ref, (e as Error).message);
    return go("/checkout/failed", { reason: "verify_error", ref: order.ref });
  }
  console.info("[dpo/return] verifyToken", order.ref, v.result, v.resultExplanation);

  if (v.paid) {
    const paidCents = toCents(v.transactionAmount);
    const currency = (v.transactionCurrency ?? "").toUpperCase();
    const refOk = !v.companyRef || v.companyRef === order.ref;
    if (paidCents !== order.a || currency !== order.c || !refOk) {
      console.error("[dpo/return] amount/currency/ref mismatch", order.ref, {
        expected: [order.a, order.c],
        got: [paidCents, currency],
        refOk,
      });
      return go("/checkout/failed", { reason: "amount_mismatch", ref: order.ref });
    }
    const receipt: ReceiptPayload = {
      v: 1,
      ref: order.ref,
      e: order.e,
      i: order.i,
      a: order.a,
      c: order.c,
      ap: v.transactionApproval || v.transactionRef,
      at: Date.now(),
    };
    return go("/checkout/success", { r: sign("receipt", receipt) });
  }

  if (isBack || v.result === "904") {
    return go("/checkout/cancelled", { o: q.get("o")! });
  }
  return go("/checkout/failed", { reason: v.result === "900" ? "not_paid" : `dpo_${v.result || "unknown"}`, ref: order.ref });
}
