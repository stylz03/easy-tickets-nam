import "server-only";
import { verifyToken, toCents } from "./dpo";
import { amountCents, transitionOrder, getOrderByRef, type OrderRow } from "./orders-db";
export async function settlePayment(order: OrderRow): Promise<OrderRow> {
  if (order.status === "paid" || !order.dpo_trans_token) return order;
  const result = await verifyToken(order.dpo_trans_token);
  if (result.paid) {
    if (toCents(result.transactionAmount) !== amountCents(order) ||
      result.transactionCurrency?.toUpperCase() !== order.currency.toUpperCase() ||
      (result.companyRef && result.companyRef !== order.ref)) {
      // Retain the reservation for manual investigation; never release stock
      // when the gateway says money was received but the receipt differs.
      await transitionOrder(order.id, ["pending"], {dpo_result_code:"amount_mismatch"});
      throw new Error("Payment details require manual review.");
    }
    await transitionOrder(order.id, ["pending","failed","cancelled"], {
      status:"paid",paid_at:new Date().toISOString(),dpo_result_code:result.result,
      dpo_approval:result.transactionApproval || null,
      ...(result.transactionRef ? {dpo_trans_ref:result.transactionRef} : {})
    });
  } else {
    // Only confirmed expiry/cancellation releases stock. A declined attempt or
    // browser Back action can still be followed by payment on the same token.
    const status = result.result === "903" ? "failed" : result.result === "904" ? "cancelled" : undefined;
    await transitionOrder(order.id, ["pending"], {dpo_result_code:result.result || null,...(status ? {status} : {})});
  }
  return (await getOrderByRef(order.ref)) ?? order;
}
