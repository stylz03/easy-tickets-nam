import { organiserIdentity, ownedEvent } from "@/lib/organiser-api";
import { json, sameOrigin } from "@/lib/account-api";
import { supabaseAdmin } from "@/lib/supabase-admin";

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

export async function GET(req: Request) {
  try {
    const identity = await organiserIdentity();
    if (!identity) return json({ error: "Please sign in." }, 401);
    const eventId = Number(new URL(req.url).searchParams.get("event"));
    if (!Number.isSafeInteger(eventId) || !(await ownedEvent(eventId, identity.user.id))) return json({ error: "Event manager access required." }, 403);
    const { data, error } = await supabaseAdmin().from("website_event_staff_audit")
      .select("id,event_id,email,user_id,assigned_by,status,invited_at,accepted_at,revoked_at,expires_at,last_activity_at")
      .eq("event_id", eventId).order("invited_at", { ascending: false }).limit(500);
    if (error) throw error;
    const now = Date.now();
    return json({ staff: (data ?? []).map((row: any) => ({
      ...row,
      status: row.status !== "revoked" && row.expires_at && new Date(row.expires_at).getTime() <= now ? "expired" : row.status,
    })) });
  } catch { return json({ error: "Staff records are not available right now." }, 503); }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);
  try {
    const identity = await organiserIdentity();
    if (!identity) return json({ error: "Please sign in." }, 401);
    const body = await req.json().catch(() => null);
    const eventId = body?.eventId;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!Number.isSafeInteger(eventId) || !EMAIL_RE.test(email) || email.length > 254) return json({ error: "Choose an event and enter a valid email address." }, 400);
    const event = await ownedEvent(eventId, identity.user.id);
    if (!event) return json({ error: "Event manager access required." }, 403);
    const admin = supabaseAdmin();
    const expiresAt = await eventEnd(admin, eventId);
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return json({ error: "This event has ended; staff cannot be assigned." }, 409);

    const { data: users, error: userError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (userError) throw userError;
    const confirmed = users.users.find((candidate) => candidate.email?.toLowerCase() === email && !!candidate.email_confirmed_at);
    if (confirmed) {
      const { error } = await identity.client.rpc("assign_website_event_staff", { p_event_id: eventId, p_email: email });
      if (error) return json({ error: error.message.includes("Event has ended") ? "This event has ended; staff cannot be assigned." : "Staff access could not be assigned. Please try again." }, error.message.includes("Event has ended") ? 409 : 503);
      const { error: auditError } = await admin.from("website_event_staff_audit").insert({ event_id:eventId,organisation_id:event.organisation_id,email,user_id:confirmed.id,assigned_by:identity.user.id,status:"assigned",expires_at:expiresAt });
      if (auditError) return json({ error:"Access was assigned, but its audit record could not be saved. Contact support." },503);
      return json({ ok:true,invited:false });
    }

    const redirectTo = new URL("/auth/update-password?next=/check-in", req.url).toString();
    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (inviteError || !invitation.user?.id) {
      console.error("[staff] Supabase invite failed", inviteError?.message ?? "missing user ID");
      return json({ error:"The invitation could not be sent. If this account already exists, ask the staff member to confirm their email first." },503);
    }
    const { error: staffError } = await admin.from("website_event_staff").upsert({ event_id:eventId,user_id:invitation.user.id },{ onConflict:"event_id,user_id" });
    if (staffError) {
      console.error("[staff] Supabase staff assignment failed",staffError.message);
      return json({ error:"The invite email was sent, but event access needs attention. Please contact Easy Tickets support." },503);
    }
    const { error: auditError } = await admin.from("website_event_staff_audit").insert({ event_id:eventId,organisation_id:event.organisation_id,email,user_id:invitation.user.id,assigned_by:identity.user.id,status:"invited",invited_at:new Date().toISOString(),expires_at:expiresAt });
    if (auditError) return json({ error:"The invite was sent, but its audit record could not be saved. Contact support." },503);
    return json({ ok:true,invited:true });
  } catch { return json({ error:"Staff management is unavailable." },503); }
}

async function eventEnd(admin: ReturnType<typeof supabaseAdmin>, eventId: number) {
  const { data, error } = await admin.rpc("website_event_end_at", { p_event_id:eventId });
  if (error) throw error;
  return data as string|null;
}
