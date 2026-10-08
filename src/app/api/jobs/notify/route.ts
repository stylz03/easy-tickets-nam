import { timingSafeEqual } from "node:crypto";
import { json } from "@/lib/account-api";
import { sendEventReminders, sendPushReminders, sendTicketEmails } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (process.env.EASY_TICKETS_NOTIFICATIONS_ENABLED !== "true") return json({ error: "Notifications are not enabled." }, 503);
  const secret = process.env.CRON_SECRET;
  if (!secret || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !process.env.EASY_TICKETS_NOTIFICATIONS_SINCE)
    return json({ error: "Notification delivery is not configured." }, 503);
  const actual = Buffer.from(req.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return json({ error: "Unauthorized." }, 401);
  try {
    const tickets = await sendTicketEmails();
    const reminders = await sendEventReminders();
    const push = await sendPushReminders();
    return json({ tickets, reminders, push });
  } catch (cause) {
    console.error("[notify] job failed", (cause as Error).message);
    return json({ error: "Notification job failed." }, 503);
  }
}
