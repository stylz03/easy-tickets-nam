import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { events, getEvent, getTier, MAX_TICKETS_PER_ORDER, MAX_TICKETS_PER_TIER, type EventItem, type TierId } from "@/data/events";

/**
 * Order pricing + ref helpers. Orders are persisted in Supabase (see
 * src/lib/orders-db.ts); prices are always recomputed from src/data/events.ts.
 */

export type OrderItem = { tier: TierId; qty: number };

/**
 * HMAC purposes. With the database as the source of truth, signing is only used
 * for *capability links*: the ref in our DPO Redirect/Back URLs and in the
 * success/cancelled page links is signed, so nobody can enumerate refs to view
 * other people's orders or trigger verification for arbitrary orders.
 */
type Purpose = "return" | "receipt";

function secret(): Buffer {
  const s = process.env.ORDER_SIGNING_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ORDER_SIGNING_SECRET is missing or too short (min 32 chars)");
  }
  return Buffer.from(s, "utf8");
}

/** HMAC-SHA256 signature (base64url) binding a purpose to an order ref. */
export function signRef(purpose: Purpose, ref: string): string {
  return createHmac("sha256", secret()).update(`${purpose}.${ref}`).digest("base64url");
}

export function verifyRef(purpose: Purpose, ref: string | null | undefined, sig: string | null | undefined): boolean {
  if (!ref || !sig || !REF_RE.test(ref) || sig.length > 128) return false;
  let expected: string;
  try {
    expected = signRef(purpose, ref);
  } catch {
    return false;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const REF_RE = /^ET-\d{8}-[0-9A-F]{8}$/;

export function newOrderRef(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `ET-${ymd}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export class OrderValidationError extends Error {}

/** Validate requested items and compute the authoritative total (cents). */
export function priceOrder(eventId: unknown, rawItems: unknown, catalogueEvents: EventItem[] = events) {
  const id = typeof eventId === "number" ? eventId : Number(String(eventId));
  const event = Number.isSafeInteger(id) ? catalogueEvents.find(e => e.id === id) : undefined;
  if (!event) throw new OrderValidationError("Unknown event");
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 10) {
    throw new OrderValidationError("Select at least one ticket");
  }
  const merged = new Map<TierId, number>();
  for (const raw of rawItems) {
    const tierId = (raw as { tier?: unknown })?.tier;
    const qty = (raw as { qty?: unknown })?.qty;
    if (typeof tierId !== "string") throw new OrderValidationError("Invalid ticket type");
    const tier = getTier(event, tierId);
    if (!tier) throw new OrderValidationError("Invalid ticket type");
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 0 || qty > MAX_TICKETS_PER_TIER) {
      throw new OrderValidationError("Invalid quantity");
    }
    if (qty === 0) continue;
    merged.set(tier.id, (merged.get(tier.id) ?? 0) + qty);
  }
  const items: [TierId, number][] = [];
  let totalQty = 0;
  let amountCents = 0;
  for (const tier of event.tiers) {
    const q = merged.get(tier.id);
    if (!q) continue;
    if (q > MAX_TICKETS_PER_TIER) throw new OrderValidationError("Invalid quantity");
    items.push([tier.id, q]);
    totalQty += q;
    amountCents += tier.price * 100 * q;
  }
  if (totalQty === 0) throw new OrderValidationError("Select at least one ticket");
  if (totalQty > MAX_TICKETS_PER_ORDER) throw new OrderValidationError(`Max ${MAX_TICKETS_PER_ORDER} tickets per order`);
  return { event, items, totalQty, amountCents };
}

/** Human summary, e.g. "2x Standard, 1x VIP". */
export function describeItems(eventId: number, items: [TierId, number][]): string {
  const event = getEvent(eventId);
  return items
    .map(([t, q]) => `${q}x ${event ? getTier(event, t)?.name ?? t : t}`)
    .join(", ");
}
