import { json, sameOrigin } from "@/lib/account-api";
import { verifyRef } from "@/lib/orders";
import { getOrderByRef } from "@/lib/orders-db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { uuid } from "@/lib/tickets";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);
  const body = await req.json().catch(() => null);
  const ref = typeof body?.ref === "string" ? body.ref : "";
  const sig = typeof body?.sig === "string" ? body.sig : "";
  const ticketId = typeof body?.ticketId === "string" ? body.ticketId : "";
  const name = typeof body?.name === "string"
    ? body.name.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim()
    : "";

  if (!verifyRef("receipt", ref, sig) || !uuid.test(ticketId)) return json({ error: "This booking link is invalid." }, 403);
  if (name.length < 2 || name.length > 100) return json({ error: "Enter a name between 2 and 100 characters." }, 400);

  try {
    const order = await getOrderByRef(ref);
    if (!order || order.status !== "paid") return json({ error: "This booking is not paid." }, 403);
    const { data, error } = await supabaseAdmin().from("website_tickets")
      .update({ holder_name: name })
      .eq("id", ticketId)
      .eq("order_id", order.id)
      .eq("status", "valid")
      .select("id,holder_name")
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "This ticket cannot be renamed." }, 409);
    return json({ ok: true, holderName: data.holder_name });
  } catch {
    return json({ error: "Ticket details are unavailable. Please try again." }, 503);
  }
}
