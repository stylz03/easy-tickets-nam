import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { TierId } from "@/data/events";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export interface OrderItemRow {
  tier: TierId;
  name: string;
  qty: number;
  unit_price: number;
}

export interface OrderRow {
  id: string;
  ref: string;
  event_id: number;
  event_name: string;
  event_date: string | null;
  items: OrderItemRow[];
  /** numeric comes back from PostgREST as number or string */
  amount: number | string;
  currency: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  status: OrderStatus;
  dpo_trans_token: string | null;
  dpo_trans_ref: string | null;
  dpo_result_code: string | null;
  dpo_approval: string | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

const TABLE = "orders";

/** "2026/11/14 16:00" (Namibia local, UTC+2) -> ISO timestamptz */
export function eventStartIso(startsAt: string): string | null {
  const m = startsAt.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+02:00` : null;
}

export function amountCents(row: Pick<OrderRow, "amount">): number {
  return Math.round(Number(row.amount) * 100);
}

export async function insertPendingOrder(
  row: Pick<OrderRow, "ref" | "event_id" | "event_name" | "event_date" | "items" | "currency" | "buyer_name" | "buyer_email" | "buyer_phone"> & {
    amount: string;
  },
): Promise<OrderRow> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .insert({ ...row, status: "pending" })
    .select()
    .single();
  if (error) throw new Error(`insert order failed: ${error.code} ${error.message}`);
  return data as OrderRow;
}

export async function attachDpoToken(id: string, token: string, transRef: string | undefined) {
  const { error } = await supabaseAdmin()
    .from(TABLE)
    .update({ dpo_trans_token: token, dpo_trans_ref: transRef ?? null })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw new Error(`attach token failed: ${error.code} ${error.message}`);
}

export async function getOrderByRef(ref: string): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin().from(TABLE).select("*").eq("ref", ref).maybeSingle();
  if (error) throw new Error(`load order failed: ${error.code} ${error.message}`);
  return (data as OrderRow) ?? null;
}

/**
 * Conditional status update: only rows currently in one of `from` are changed,
 * so a 'paid' order can never be downgraded and repeated calls are idempotent.
 * Returns the updated row, or null if nothing matched.
 */
export async function transitionOrder(
  id: string,
  from: OrderStatus[],
  patch: Partial<Pick<OrderRow, "status" | "dpo_result_code" | "dpo_approval" | "dpo_trans_ref" | "paid_at">>,
): Promise<OrderRow | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .in("status", from)
    .select()
    .maybeSingle();
  if (error) throw new Error(`update order failed: ${error.code} ${error.message}`);
  return (data as OrderRow) ?? null;
}
