import { NextResponse } from "next/server";
import { createToken, DpoConfigError, formatAmount, getDpoConfig } from "@/lib/dpo";
import { describeItems, newOrderRef, OrderValidationError, priceOrder, signRef } from "@/lib/orders";
import { attachDpoToken, eventStartIso, insertPendingOrder, transitionOrder } from "@/lib/orders-db";
import { getTier } from "@/data/events";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/**
 * DPO ServiceDescription: real event name + ticket summary + date, e.g.
 * "Desert Dune Music Fest - 2x Standard, 1x VIP - November 14, 2026".
 * Kept plain ASCII ("&" -> "and", en dash -> "-") so DPO renders it cleanly.
 */
function serviceDescription(title: string, date: string, tickets: string): string {
  return `${title} - ${tickets} - ${date}`
    .replace(/&/g, "and")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "")
    .slice(0, 200);
}

/**
 * DPO ServiceDate ("YYYY/MM/DD HH:MM"). DPO's API works in UTC (its own
 * timestamps are UTC) and the hosted page shows the date shifted to local time,
 * so a Namibia-local start of 10:00 appeared as 12:00 PM. Convert the event's
 * local start (CAT, UTC+2, no DST) to UTC before sending.
 */
const EVENT_TZ_OFFSET_HOURS = 2;
function dpoServiceDate(localStart: string): string {
  const m = localStart.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/);
  if (!m) return localStart;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - EVENT_TZ_OFFSET_HOURS, +m[5]));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

interface CheckoutBody {
  eventId?: unknown;
  items?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
}

async function readBody(req: Request): Promise<{ body: CheckoutBody; isForm: boolean }> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return { body: (await req.json()) as CheckoutBody, isForm: false };
  }
  const fd = await req.formData();
  const items = ["standard", "premium", "vip"].map((tier) => ({
    tier,
    qty: Number.parseInt(String(fd.get(`qty_${tier}`) ?? "0"), 10) || 0,
  }));
  return {
    body: {
      eventId: fd.get("eventId"),
      items,
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
    },
    isForm: true,
  };
}

function fail(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  let parsed: { body: CheckoutBody; isForm: boolean };
  try {
    parsed = await readBody(req);
  } catch {
    return fail(400, "Invalid request body");
  }
  const { body, isForm } = parsed;

  // ---- Validate buyer -------------------------------------------------
  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const phoneRaw = clean(body.phone, 30);
  const phoneDigits = phoneRaw.replace(/[^\d]/g, "");
  if (name.length < 2) return fail(400, "Please enter your full name");
  if (!EMAIL_RE.test(email)) return fail(400, "Please enter a valid email address");
  if (phoneDigits.length < 7 || phoneDigits.length > 15 || !/^\+?[\d\s()-]+$/.test(phoneRaw)) {
    return fail(400, "Please enter a valid phone number");
  }
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ") || firstName;

  // ---- Price server-side from the catalogue ---------------------------
  let priced: ReturnType<typeof priceOrder>;
  try {
    priced = priceOrder(body.eventId, body.items);
  } catch (e) {
    if (e instanceof OrderValidationError) return fail(400, e.message);
    throw e;
  }

  let cfg: ReturnType<typeof getDpoConfig>;
  try {
    cfg = getDpoConfig();
  } catch (e) {
    if (e instanceof DpoConfigError) return fail(503, "Payments are not configured");
    throw e;
  }

  // ---- 1. Persist a pending order (DB is the source of truth) ----------
  const ref = newOrderRef();
  let returnSig: string;
  try {
    returnSig = signRef("return", ref);
  } catch {
    return fail(503, "Payments are not configured");
  }

  let order;
  try {
    order = await insertPendingOrder({
      ref,
      event_id: priced.event.id,
      event_name: priced.event.title,
      event_date: eventStartIso(priced.event.startsAt),
      items: priced.items.map(([tier, qty]) => ({
        tier,
        name: getTier(priced.event, tier)!.name,
        qty,
        unit_price: getTier(priced.event, tier)!.price,
      })),
      amount: formatAmount(priced.amountCents),
      currency: cfg.currency,
      buyer_name: name,
      buyer_email: email,
      buyer_phone: phoneRaw,
    });
  } catch (e) {
    console.error("[checkout] order insert failed", ref, (e as Error).message);
    return fail(503, "Could not create your order. Please try again.");
  }

  // ---- 2. createToken with DPO -----------------------------------------
  const base = siteUrl(req);
  const q = `ref=${encodeURIComponent(ref)}&sig=${encodeURIComponent(returnSig)}`;
  const redirectUrl = `${base}/api/dpo/return?${q}`;
  const backUrl = `${base}/api/dpo/return?back=1&${q}`;

  const svcDescription = serviceDescription(
    priced.event.title,
    priced.event.fullDate,
    describeItems(priced.event.id, priced.items),
  );
  const svcDate = dpoServiceDate(priced.event.startsAt);

  let token: Awaited<ReturnType<typeof createToken>>;
  try {
    token = await createToken({
      amountCents: priced.amountCents,
      currency: cfg.currency,
      companyRef: ref,
      redirectUrl,
      backUrl,
      serviceDescription: svcDescription,
      serviceDate: svcDate,
      customer: { firstName, lastName, email, phone: phoneDigits },
    });
  } catch (e) {
    console.error("[checkout] createToken request failed", ref, (e as Error).message);
    await transitionOrder(order.id, ["pending"], { status: "failed", dpo_result_code: "create_error" }).catch(() => null);
    return fail(502, "Could not reach the payment provider. Please try again.");
  }

  if (!token.ok || !token.transToken || !token.paymentUrl) {
    console.error("[checkout] createToken rejected", ref, token.result, token.resultExplanation);
    await transitionOrder(order.id, ["pending"], {
      status: "failed",
      dpo_result_code: `create_${token.result || "unknown"}`,
    }).catch(() => null);
    return fail(502, `Payment provider error (${token.result || "unknown"})`);
  }

  // ---- 3. Store the DPO token on the order ------------------------------
  try {
    await attachDpoToken(order.id, token.transToken, token.transRef);
  } catch (e) {
    console.error("[checkout] attach token failed", ref, (e as Error).message);
    return fail(503, "Could not save your order. Please try again.");
  }

  return isForm
    ? NextResponse.redirect(token.paymentUrl, 303)
    : NextResponse.json(
        {
          ok: true,
          ref,
          url: token.paymentUrl,
          transToken: token.transToken,
          amount: priced.amountCents / 100,
          currency: cfg.currency,
          serviceDescription: svcDescription,
          serviceDateUtc: svcDate,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
}
