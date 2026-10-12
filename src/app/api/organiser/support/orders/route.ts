import { NextResponse } from "next/server";
import { organiserIdentity, ownedEvent } from "@/lib/organiser-api";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrderByRef, type OrderRow } from "@/lib/orders-db";
import { settlePayment } from "@/lib/payment-settlement";
import { orderTickets } from "@/lib/tickets";
import { signRef } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function access() {
  const identity = await organiserIdentity();
  return identity && identity.members.length ? identity : null;
}

async function visible(identity: Awaited<ReturnType<typeof access>>, order: OrderRow | null) {
  return !!identity && !!order && (await ownedEvent(order.event_id, identity.user.id));
}

export async function GET(req: Request) {
  try {
    const identity = await access(); if (!identity) return NextResponse.json({ error: "Support access required." }, { status: 403 });
    const q = new URL(req.url).searchParams;
    const ref = q.get("ref")?.trim().toUpperCase();
    const email = q.get("email")?.trim().toLowerCase();
    if (!ref && !email) return NextResponse.json({ error: "Provide an order reference or email." }, { status: 400 });
    const db = supabaseAdmin();
    let query = db.from("orders").select("id,ref,event_id,event_name,buyer_name,buyer_email,amount,currency,status,dpo_trans_ref,dpo_result_code,created_at,paid_at,updated_at").order("created_at", { ascending: false }).limit(25);
    if (ref) query = query.eq("ref", ref); else query = query.ilike("buyer_email", email!);
    const { data, error } = await query; if (error) throw error;
    const orders = [];
    for (const row of (data ?? []) as OrderRow[]) {
      if (!(await visible(identity, row))) continue;
      const tickets = await orderTickets(row.id);
      orders.push({ ...row, tickets: tickets.map((t) => ({ id: t.id, status: t.status })), receiptUrl: row.status === "paid" ? `/checkout/success?ref=${encodeURIComponent(row.ref)}&sig=${encodeURIComponent(signRef("receipt", row.ref))}` : null });
    }
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Could not load support orders." }, { status: 503 }); }
}

export async function POST(req: Request) {
  try {
    const identity = await access(); if (!identity) return NextResponse.json({ error: "Support access required." }, { status: 403 });
    const body = await req.json(); const ref = typeof body?.ref === "string" ? body.ref.trim().toUpperCase() : "";
    const order = ref ? await getOrderByRef(ref) : null;
    if (!(await visible(identity, order))) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const settled = order!.status === "pending" && order!.dpo_trans_token ? await settlePayment(order!) : order!;
    const tickets = await orderTickets(settled.id);
    return NextResponse.json({ ok: true, order: { ref: settled.ref, status: settled.status, dpoResult: settled.dpo_result_code, tickets: tickets.map((t) => ({ id: t.id, status: t.status })), receiptUrl: settled.status === "paid" ? `/checkout/success?ref=${encodeURIComponent(settled.ref)}&sig=${encodeURIComponent(signRef("receipt", settled.ref))}` : null } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Could not reconcile that order." }, { status: 503 }); }
}
