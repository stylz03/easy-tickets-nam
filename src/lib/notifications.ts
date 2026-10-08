import "server-only";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { siteUrl } from "@/lib/site-url";
import { orderTickets } from "@/lib/tickets";
import type { OrderRow } from "@/lib/orders-db";
import webPush from "web-push";
import { trustedPushEndpoint } from "@/lib/push-endpoint";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]!);
const origin = () => (process.env.APP_BASE_URL || siteUrl()).replace(/\/+$/, "");
const idFor = (kind: string, eventId: number, email: string) =>
  createHash("sha256").update(`${kind}:${eventId}:${email.toLowerCase()}`).digest("hex");

async function sendEmail(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) throw new Error("Resend is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Resend rejected an email (${response.status}).`);
  const body = await response.json() as { id?: string };
  if (!body.id) throw new Error("Resend did not return an email ID.");
  return body.id;
}

export async function sendTicketEmails(): Promise<{ sent: number; errors: number }> {
  const since = process.env.EASY_TICKETS_NOTIFICATIONS_SINCE;
  if (!since || !Number.isFinite(Date.parse(since))) throw new Error("Set EASY_TICKETS_NOTIFICATIONS_SINCE before enabling delivery.");
  const db = supabaseAdmin();
  const { data, error } = await db.from("orders").select("*")
    .eq("status", "paid").is("ticket_email_sent_at", null)
    .gte("paid_at", since).order("paid_at").limit(10);
  if (error) throw error;
  let sent = 0, errors = 0;
  for (const order of (data ?? []) as OrderRow[]) {
    try {
      const tickets = await orderTickets(order.id);
      if (!tickets.length) throw new Error("Paid order has no tickets.");
      const links = tickets.map((ticket, index) => ({
        label: `Ticket ${index + 1} · ${ticket.tier_name}`,
        url: `${origin()}/tickets/${ticket.id}?key=${ticket.secret}`,
      }));
      const rows = links.map((link) => `<li style="margin:12px 0"><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></li>`).join("");
      await sendEmail({
        to: order.buyer_email,
        subject: `Your tickets for ${order.event_name} · ${order.ref}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172b42"><h1>Your tickets are ready</h1><p>${escapeHtml(order.event_name)} · ${escapeHtml(order.ref)}</p><p>There is one entry code per ticket. Share individual ticket links only with the people who will use them.</p><ul>${rows}</ul><p>Keep this email private. Each link opens a scannable ticket.</p></div>`,
        text: `Your tickets for ${order.event_name} (${order.ref})\n\n${links.map((link) => `${link.label}: ${link.url}`).join("\n")}\n\nEach link contains a scannable ticket. Share only with its holder.`,
        idempotencyKey: `ticket-${order.id}`,
      });
      const { error: updateError } = await db.from("orders").update({ ticket_email_sent_at: new Date().toISOString() })
        .eq("id", order.id).is("ticket_email_sent_at", null);
      if (updateError) throw updateError;
      sent++;
    } catch (cause) { console.error("[notify] ticket email failed", order.id, (cause as Error).message); errors++; }
  }
  return { sent, errors };
}

type SavedRow = { user_id: string };
type BuyerRow = { buyer_email: string; user_id: string | null };
type Preference = { user_id: string; email_purchased: boolean; email_saved: boolean };
type EventRow = { id: number; title: string; starts_at: string };

export async function sendEventReminders(): Promise<{ sent: number; errors: number }> {
  const db = supabaseAdmin();
  const now = Date.now();
  const { data: events, error } = await db.from("website_events").select("id,title,starts_at")
    .eq("published", true).gt("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 48 * 3600000).toISOString())
    .order("starts_at").limit(20);
  if (error) throw error;
  let sent = 0, errors = 0;
  for (const event of (events ?? []) as EventRow[]) {
    const hours = (Date.parse(event.starts_at) - now) / 3600000;
    const window = hours > 24 ? 48 : hours > 2 ? 24 : 2;
    const kind = `reminder-${window}h`;
    const [buyersResult, savedResult] = await Promise.all([
      db.from("orders").select("buyer_email,user_id").eq("event_id", event.id).eq("status", "paid").limit(1000),
      db.from("website_saved_events").select("user_id").eq("event_id", event.id).limit(1000),
    ]);
    if (buyersResult.error || savedResult.error) { errors++; continue; }
    const buyers = (buyersResult.data ?? []) as BuyerRow[];
    const saved = (savedResult.data ?? []) as SavedRow[];
    const ids = [...new Set([...buyers.map((row) => row.user_id), ...saved.map((row) => row.user_id)].filter((id): id is string => !!id))];
    const { data: prefs, error: prefError } = ids.length
      ? await db.from("website_notification_preferences").select("user_id,email_purchased,email_saved").in("user_id", ids)
      : { data: [] as Preference[], error: null };
    if (prefError) { errors++; continue; }
    const preferences = new Map(((prefs ?? []) as Preference[]).map((row) => [row.user_id, row]));
    const recipients = new Set<string>();
    for (const row of buyers) if (!row.user_id || preferences.get(row.user_id)?.email_purchased !== false) recipients.add(row.buyer_email.toLowerCase());
    for (const row of saved) {
      if (!preferences.get(row.user_id)?.email_saved) continue;
      const { data: account } = await db.auth.admin.getUserById(row.user_id);
      if (account.user?.email) recipients.add(account.user.email.toLowerCase());
    }
    for (const email of recipients) {
      if (sent >= 30) return { sent, errors };
      const id = idFor(kind, event.id, email);
      const { data: existing, error: lookupError } = await db.from("website_notification_log").select("id").eq("id", id).maybeSingle();
      if (lookupError) { errors++; continue; }
      if (existing) continue;
      try {
        const url = `${origin()}/events/${event.id}`;
        const label = window === 2 ? "about two hours" : `${window} hours`;
        const providerId = await sendEmail({
          to: email,
          subject: `${event.title} starts in ${label}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172b42"><h1>Your event is coming up</h1><p>${escapeHtml(event.title)} starts in ${label}.</p><p><a href="${escapeHtml(url)}">View event details</a></p><p>If you bought tickets, your scannable tickets are in your booking email and Easy Tickets account.</p></div>`,
          text: `${event.title} starts in ${label}.\n\nView event: ${url}\n\nIf you bought tickets, find them in your booking email or Easy Tickets account.`,
          idempotencyKey: id,
        });
        const { error: logError } = await db.from("website_notification_log").insert({ id, event_id: event.id, recipient: email, kind, provider_id: providerId });
        if (logError && logError.code !== "23505") throw logError;
        sent++;
      } catch (cause) { console.error("[notify] reminder failed", event.id, (cause as Error).message); errors++; }
    }
  }
  return { sent, errors };
}

type PushSubscriptionRow = { endpoint: string; user_id: string; p256dh: string; auth_secret: string };
export async function sendPushReminders(): Promise<{ sent: number; errors: number }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return { sent: 0, errors: 0 };
  webPush.setVapidDetails(subject, publicKey, privateKey);
  const db = supabaseAdmin();
  const now = Date.now();
  const { data: events, error } = await db.from("website_events").select("id,title,starts_at")
    .eq("published", true).gt("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 48 * 3600000).toISOString()).order("starts_at").limit(20);
  if (error) throw error;
  let sent = 0, errors = 0;
  for (const event of (events ?? []) as EventRow[]) {
    const hours = (Date.parse(event.starts_at) - now) / 3600000;
    const window = hours > 24 ? 48 : hours > 2 ? 24 : 2;
    const kind = `push-reminder-${window}h`;
    const [buyersResult, savedResult] = await Promise.all([
      db.from("orders").select("user_id").eq("event_id", event.id).eq("status", "paid").limit(1000),
      db.from("website_saved_events").select("user_id").eq("event_id", event.id).limit(1000),
    ]);
    if (buyersResult.error || savedResult.error) { errors++; continue; }
    const ids = [...new Set([...(buyersResult.data ?? []).map((row) => row.user_id), ...(savedResult.data ?? []).map((row) => row.user_id)].filter((id): id is string => !!id))];
    if (!ids.length) continue;
    const { data: prefs, error: prefError } = await db.from("website_notification_preferences")
      .select("user_id").in("user_id", ids).eq("push_reminders", true);
    if (prefError) { errors++; continue; }
    const optedIn = (prefs ?? []).map((row) => row.user_id);
    if (!optedIn.length) continue;
    const { data: subscriptions, error: subError } = await db.from("website_push_subscriptions")
      .select("endpoint,user_id,p256dh,auth_secret").in("user_id", optedIn).limit(1000);
    if (subError) { errors++; continue; }
    for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
      if (sent >= 30) return { sent, errors };
      if (!trustedPushEndpoint(subscription.endpoint)) { errors++; continue; }
      const id = idFor(kind, event.id, subscription.endpoint);
      const { data: existing, error: lookupError } = await db.from("website_notification_log").select("id").eq("id", id).maybeSingle();
      if (lookupError) { errors++; continue; }
      if (existing) continue;
      try {
        await webPush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth_secret } },
          JSON.stringify({ title: event.title, body: `Starts in about ${window} hours. Your tickets are ready in Easy Tickets.`, url: `/events/${event.id}` }),
          { TTL: 3600 });
        const { error: logError } = await db.from("website_notification_log").insert({ id, event_id: event.id, recipient: subscription.user_id, kind });
        if (logError && logError.code !== "23505") throw logError;
        sent++;
      } catch (cause) {
        const statusCode = (cause as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await db.from("website_push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        else { console.error("[notify] push failed", event.id, (cause as Error).message); errors++; }
      }
    }
  }
  return { sent, errors };
}
