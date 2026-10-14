import { createClient } from "@supabase/supabase-js";
import { accountIdentity, json, sameOrigin } from "@/lib/account-api";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseTicketCredential } from "@/lib/ticket-credential";

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
  const ids = (data ?? []).map((row: { event_id: number }) => row.event_id);
  if (!ids.length) return json({ events: [] });
  if (!ids.length) return json({ events: [] });

  // Assignment is scoped by RLS above. Resolve titles server-side so a checker
  // also sees an event while the organiser is still preparing its catalogue page.
  const admin = supabaseAdmin();
  const events = await admin.from("website_events")
    .select("id,title").in("id", ids).order("starts_at");
  if (events.error) return json({ error: "Assigned events are unavailable." }, 503);
  const activeEvents = await Promise.all((events.data ?? []).map(async (event: {id:number;title:string}) => {
    const { data: endsAt, error: endError } = await admin.rpc("website_event_end_at", { p_event_id: event.id });
    if (endError) throw endError;
    return !endsAt || new Date(endsAt).getTime() > Date.now() ? event : null;
  }));
  return json({ events: activeEvents.filter((event): event is {id:number;title:string} => event !== null) });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);
  const identity = await checkInIdentity(req);
  if (!identity) return json({ error: "Please sign in again to check tickets." }, 401);
  const body = await req.json().catch(() => null);
  const ticket = parseTicketCredential(body?.credential);
  if (!ticket || !Number.isSafeInteger(body?.eventId) || body.eventId <= 0) {
    return json({ error: "This is not a valid Easy Tickets QR code." }, 400);
  }
  const { data, error } = await identity.client.rpc("check_in_website_ticket", {
    p_ticket_id: ticket.id, p_secret: ticket.secret, p_event_id: body.eventId,
  });
  if (error?.message.includes("Staff assignment required")) return json({ error: "Your account is not assigned to this event. Refresh assignments or ask the event manager." }, 403);
  if (error) {
    console.error("[check-in] ticket check failed", error.message);
    return json({ error: "Check-in is temporarily unavailable. No admission was recorded; try again." }, 503);
  }
  if (!data?.ok) return json(data ?? { error: "Ticket not valid for this event." }, data?.error?.includes("already been used") ? 409 : 422);
  return json(data);
}
