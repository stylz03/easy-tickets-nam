import { NextResponse } from "next/server";
import { ticketByKey } from "@/lib/tickets";
import { createWalletWalletPass, walletWalletEnabled } from "@/lib/walletwallet";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const wantsJson = new URL(req.url).searchParams.get("format") === "json";
  if (!walletWalletEnabled()) return NextResponse.json({ error: "Wallet passes are not configured yet." }, { status: 503 });
  const { id } = await params;
  const key = new URL(req.url).searchParams.get("key") || "";
  const ticket = await ticketByKey(id, key);
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  const db = supabaseAdmin();
  const existing = await db.from("website_tickets").select("walletwallet_share_url").eq("id", ticket.id).maybeSingle();
  if (existing.data?.walletwallet_share_url) {
    return wantsJson ? NextResponse.json({ ok: true, shareUrl: existing.data.walletwallet_share_url }) : NextResponse.redirect(existing.data.walletwallet_share_url);
  }
  try {
    const event = await db.from("website_events").select("payload").eq("id", ticket.event_id).maybeSingle();
    const imagePath = typeof event.data?.payload?.img === "string" ? event.data.payload.img : "";
    const base = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")).replace(/\/$/, "");
    const eventImage = imagePath.startsWith("https://") ? imagePath : imagePath.startsWith("/") && base ? `${base}${imagePath}` : undefined;
    const pass = await createWalletWalletPass(ticket, eventImage);
    const { error } = await db.from("website_tickets").update({ walletwallet_serial: pass.serialNumber, walletwallet_share_url: pass.shareUrl, walletwallet_google_url: pass.googleSaveUrl, walletwallet_created_at: new Date().toISOString() }).eq("id", ticket.id).eq("secret", ticket.secret);
    if (error) throw error;
    return wantsJson ? NextResponse.json({ ok: true, shareUrl: pass.shareUrl, googleSaveUrl: pass.googleSaveUrl }) : NextResponse.redirect(pass.shareUrl);
  } catch (cause) {
    console.error("[walletwallet] pass creation failed", (cause as Error).message);
    return NextResponse.json({ error: "Wallet pass creation is temporarily unavailable. Your ticket is still valid." }, { status: 502 });
  }
}
