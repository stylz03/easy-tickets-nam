import { createClient } from "@supabase/supabase-js";
import { accountIdentity, json, sameOrigin } from "@/lib/account-api";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { uuid } from "@/lib/tickets";

async function checkInIdentity(req: Request) {
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(req.headers.get("authorization") ?? "");
  if (!match) return accountIdentity();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const token = match[1];
  // Verify the submitted JWT with Supabase Auth before using it for RLS queries.
  const verifier = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await verifier.auth.getUser(token);
  if (error || !data.user) return null;
  const client = createClient(url, key, { accessToken: async () => token });
  return { client, user: data.user };
}

export async function GET(req: Request) {
  const identity = await checkInIdentity(req);
  if (!identity) return json({ error: "Please sign in again to check tickets." }, 401);
  const { data, error } = await identity.client.from("website_event_staff")
    .select("event_id").eq("user_id", identity.user.id);
  if (error) return json({ error: "Check-in services are unavailable." }, 503);
  const ids = (data ?? []).map((row) => row.event_id);
  if (!ids.length) return json({ events: [] });

  // Assignment is scoped by RLS above. Resolve titles server-side so a checker
  // also sees an event while the organiser is still preparing its catalogue page.
  const events = await supabaseAdmin().from("website_events")
    .select("id,title").in("id", ids).order("starts_at");
  if (events.error) return json({ error: "Assigned events are unavailable." }, 503);
  return json({ events: events.data ?? [] });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);
  const identity = await checkInIdentity(req);
  if (!identity) return json({ error: "Please sign in again to check tickets." }, 401);
  const body = await req.json().catch(() => null);
  const parts = typeof body?.credential === "string" ? body.credential.split(".") : [];
  if (parts.length !== 3 || parts[0] !== "ET1" || !uuid.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2]) || !Number.isSafeInteger(body.eventId)) {
    return json({ error: "This is not a valid Easy Tickets QR code." }, 400);
  }
  const { data, error } = await identity.client.rpc("check_in_website_ticket", {
    p_ticket_id: parts[1], p_secret: parts[2], p_event_id: body.eventId,
  });
  if (error) return json({ error: "You are not authorised for this event, or check-in is unavailable." }, 403);
  return json(data);
}
