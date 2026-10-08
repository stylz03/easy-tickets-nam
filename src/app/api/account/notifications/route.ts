import { accountIdentity, json, sameOrigin } from "@/lib/account-api";

export async function GET() {
  const identity = await accountIdentity();
  if (!identity) return json({ error: "Please sign in." }, 401);
  const { data, error } = await identity.client.from("website_notification_preferences")
    .select("email_purchased,email_saved,push_reminders").eq("user_id", identity.user.id).maybeSingle();
  return error ? json({ error: "Notification settings are unavailable." }, 503)
    : json({ preferences: data ?? { email_purchased: true, email_saved: false, push_reminders: false } });
}

export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);
  const identity = await accountIdentity();
  if (!identity) return json({ error: "Please sign in." }, 401);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email_purchased !== "boolean" || typeof body.email_saved !== "boolean")
    return json({ error: "Choose your email preferences." }, 400);
  const table = identity.client.from("website_notification_preferences");
  const { data: existing, error: lookupError } = await table.select("user_id").eq("user_id", identity.user.id).maybeSingle();
  if (lookupError) return json({ error: "Could not load notification settings." }, 503);
  const patch = { email_purchased: body.email_purchased, email_saved: body.email_saved, updated_at: new Date().toISOString() };
  const { error } = existing
    ? await table.update(patch).eq("user_id", identity.user.id)
    : await table.insert({ user_id: identity.user.id, ...patch });
  return error ? json({ error: "Could not save notification settings." }, 503) : json({ ok: true });
}
