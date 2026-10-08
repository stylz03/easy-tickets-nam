import { organiserIdentity, ownedEvent } from "@/lib/organiser-api";
import { json, sameOrigin } from "@/lib/account-api";
import { supabaseAdmin } from "@/lib/supabase-admin";

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);

  try {
    const identity = await organiserIdentity();
    if (!identity) return json({ error: "Please sign in." }, 401);

    const body = await req.json().catch(() => null);
    const eventId = body?.eventId;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!Number.isSafeInteger(eventId) || !EMAIL_RE.test(email) || email.length > 254) {
      return json({ error: "Choose an event and enter a valid email address." }, 400);
    }
    if (!(await ownedEvent(eventId, identity.user.id))) {
      return json({ error: "Event manager access required." }, 403);
    }

    // Existing confirmed accounts can be assigned without sending another email.
    const { error: assignError } = await identity.client.rpc("assign_website_event_staff", {
      p_event_id: eventId,
      p_email: email,
    });
    if (!assignError) return json({ ok: true, invited: false });
    if (!assignError.message.includes("Confirmed staff account required")) {
      return json({ error: "Staff access could not be assigned. Please try again." }, 503);
    }

    // A new checker receives Supabase's invite email. The returned Auth user ID
    // is assigned only to this event; accepting the invite enables check-in.
    const admin = supabaseAdmin();
    const redirectTo = new URL("/auth/update-password", req.url).toString();
    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    if (inviteError || !invitation.user?.id) {
      console.error("[staff] Supabase invite failed", inviteError?.message ?? "missing user ID");
      return json({ error: "The invitation could not be sent. If this account already exists, ask the staff member to confirm their email first." }, 503);
    }

    const { error: staffError } = await admin.from("website_event_staff").upsert(
      { event_id: eventId, user_id: invitation.user.id },
      { onConflict: "event_id,user_id" },
    );
    if (staffError) {
      console.error("[staff] Supabase staff assignment failed", staffError.message);
      return json({ error: "The invite email was sent, but event access needs attention. Please contact Easy Tickets support." }, 503);
    }
    return json({ ok: true, invited: true });
  } catch {
    return json({ error: "Staff management is unavailable." }, 503);
  }
}
