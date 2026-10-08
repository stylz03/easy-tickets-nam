import { accountIdentity, json, sameOrigin } from "@/lib/account-api";
import { trustedPushEndpoint } from "@/lib/push-endpoint";
import { supabaseAdmin } from "@/lib/supabase-admin";

const base64 = /^[A-Za-z0-9_-]+$/;
function validSubscription(body: unknown): body is { endpoint: string; keys: { p256dh: string; auth: string } } {
  if (!body || typeof body !== "object") return false;
  const value = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof value.endpoint !== "string" || value.endpoint.length > 2048) return false;
  if (!trustedPushEndpoint(value.endpoint)) return false;
  return typeof value.keys?.p256dh === "string" && value.keys.p256dh.length >= 40 && value.keys.p256dh.length <= 200 && base64.test(value.keys.p256dh)
    && typeof value.keys?.auth === "string" && value.keys.auth.length >= 10 && value.keys.auth.length <= 100 && base64.test(value.keys.auth);
}

export async function GET() {
  const identity = await accountIdentity();
  if (!identity) return json({ error: "Please sign in." }, 401);
  return json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);
  const identity = await accountIdentity();
  if (!identity) return json({ error: "Please sign in." }, 401);
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT)
    return json({ error: "Push notifications are not configured yet." }, 503);
  const body: unknown = await req.json().catch(() => null);
  if (!validSubscription(body)) return json({ error: "Invalid push subscription." }, 400);
  const table = supabaseAdmin().from("website_push_subscriptions");
  const { data: existing, error: lookupError } = await table.select("user_id").eq("endpoint", body.endpoint).maybeSingle();
  if (lookupError) return json({ error: "Could not inspect this device." }, 503);
  if (existing && existing.user_id !== identity.user.id) return json({ error: "This device is linked to another account." }, 409);
  const { error } = await table.upsert({
    endpoint: body.endpoint, user_id: identity.user.id, p256dh: body.keys.p256dh,
    auth_secret: body.keys.auth,
  }, { onConflict: "endpoint" });
  if (error) return json({ error: "Could not save this device." }, 503);
  const preferences = identity.client.from("website_notification_preferences");
  const { data: existingPreferences } = await preferences.select("user_id").eq("user_id", identity.user.id).maybeSingle();
  const patch = { push_reminders: true, updated_at: new Date().toISOString() };
  const { error: prefError } = existingPreferences
    ? await preferences.update(patch).eq("user_id", identity.user.id)
    : await preferences.insert({ user_id: identity.user.id, ...patch });
  return prefError ? json({ error: "Could not enable push reminders." }, 503) : json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Invalid request." }, 403);
  const identity = await accountIdentity();
  if (!identity) return json({ error: "Please sign in." }, 401);
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint !== "string" || body.endpoint.length > 2048) return json({ error: "Invalid device." }, 400);
  const { error } = await supabaseAdmin().from("website_push_subscriptions").delete().eq("user_id", identity.user.id).eq("endpoint", body.endpoint);
  return error ? json({ error: "Could not remove this device." }, 503) : json({ ok: true });
}
