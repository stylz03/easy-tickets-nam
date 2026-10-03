import { NextResponse, type NextRequest } from "next/server";
import { toCents, verifyToken } from "@/lib/dpo";
import { signRef, verifyRef } from "@/lib/orders";
import { amountCents, getOrderByRef, transitionOrder, type OrderRow } from "@/lib/orders-db";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * DPO RedirectURL + BackURL handler.
 *
 * Query params are never trusted on their own:
 *  - `ref` + `sig` (HMAC, set by us in createToken) identify the order;
 *  - the order (amount, currency, DPO token) is loaded from Supabase;
 *  - DPO's TransactionToken/CompanyRef params must match the stored row;
 *  - payment status ALWAYS comes from a server-side verifyToken call, and
 *    amount + currency are checked against the DB row before marking paid.
 * Status updates are conditional (never downgrade 'paid'), so repeated hits
 * are idempotent.
 */

// verifyToken codes that mean "definitely not going to be paid" for this token.
const FAILED_CODES = new Set(["901", "902", "903", "950"]);

export async function GET(req: NextRequest) {
  const base = siteUrl(req);
  const q = req.nextUrl.searchParams;
  const isBack = q.get("back") === "1";
  const ref = q.get("ref") ?? "";

  const go = (path: string, params: Record<string, string>) => {
    const u = new URL(path, base);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    const r = NextResponse.redirect(u, 303);
    r.headers.set("Cache-Control", "no-store");
    return r;
  };
  const receiptLink = (path: string, o: OrderRow) => go(path, { ref: o.ref, sig: signRef("receipt", o.ref) });

  if (!verifyRef("return", ref, q.get("sig"))) return go("/checkout/failed", { reason: "invalid_order" });

  let order: OrderRow | null;
  try {
    order = await getOrderByRef(ref);
  } catch (e) {
    console.error("[dpo/return] order lookup failed", ref, (e as Error).message);
    return go("/checkout/failed", { reason: "verify_error", ref });
  }
  if (!order) return go("/checkout/failed", { reason: "invalid_order" });

  // Already settled -> idempotent short-circuit (never downgrade 'paid').
  if (order.status === "paid") return receiptLink("/checkout/success", order);

  const companyRef = q.get("CompanyRef");
  const qToken = q.get("TransactionToken") || q.get("TransID") || "";
  if ((companyRef && companyRef !== order.ref) || (qToken && qToken !== order.dpo_trans_token)) {
    console.warn("[dpo/return] param mismatch", order.ref);
    return go("/checkout/failed", { reason: "mismatch", ref: order.ref });
  }
  if (!order.dpo_trans_token) return go("/checkout/failed", { reason: "missing_token", ref: order.ref });

  let v: Awaited<ReturnType<typeof verifyToken>>;
  try {
    v = await verifyToken(order.dpo_trans_token);
  } catch (e) {
    console.error("[dpo/return] verifyToken request failed", order.ref, (e as Error).message);
    return go("/checkout/failed", { reason: "verify_error", ref: order.ref });
  }
  console.info("[dpo/return] verifyToken", order.ref, v.result, v.resultExplanation);

  try {
    if (v.paid) {
      const paidCents = toCents(v.transactionAmount);
      const currency = (v.transactionCurrency ?? "").toUpperCase();
      const refOk = !v.companyRef || v.companyRef === order.ref;
      if (paidCents !== amountCents(order) || currency !== order.currency.toUpperCase() || !refOk) {
        console.error("[dpo/return] amount/currency/ref mismatch", order.ref, {
          expected: [amountCents(order), order.currency],
          got: [paidCents, currency],
          refOk,
        });
        await transitionOrder(order.id, ["pending", "failed", "cancelled"], {
          status: "failed",
          dpo_result_code: "amount_mismatch",
        });
        return go("/checkout/failed", { reason: "amount_mismatch", ref: order.ref });
      }
      // Paid wins over any earlier failed/cancelled state (money was taken).
      const updated = await transitionOrder(order.id, ["pending", "failed", "cancelled"], {
        status: "paid",
        paid_at: new Date().toISOString(),
        dpo_result_code: v.result,
        dpo_approval: v.transactionApproval || null,
        ...(v.transactionRef ? { dpo_trans_ref: v.transactionRef } : {}),
      });
      const final = updated ?? (await getOrderByRef(order.ref));
      if (final?.status === "paid") return receiptLink("/checkout/success", final);
      return go("/checkout/failed", { reason: "verify_error", ref: order.ref });
    }

    if (isBack || v.result === "904") {
      await transitionOrder(order.id, ["pending"], { status: "cancelled", dpo_result_code: v.result || null });
      return receiptLink("/checkout/cancelled", order);
    }

    if (FAILED_CODES.has(v.result)) {
      await transitionOrder(order.id, ["pending"], { status: "failed", dpo_result_code: v.result });
    } else {
      // 900 (not paid yet), 003/005/007 (pending at bank) etc.: keep pending,
      // the token may still be paid within its time limit.
      await transitionOrder(order.id, ["pending"], { dpo_result_code: v.result || null });
    }
  } catch (e) {
    console.error("[dpo/return] status update failed", order.ref, (e as Error).message);
  }
  return go("/checkout/failed", {
    reason: v.result === "900" ? "not_paid" : `dpo_${v.result || "unknown"}`,
    ref: order.ref,
  });
}
