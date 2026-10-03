import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEvent, getTier, MAX_TICKETS_PER_ORDER, MAX_TICKETS_PER_TIER, type TierId } from "@/data/events";

/**
 * Stateless order handling for the DPO sandbox test.
 *
 * There is NO database yet. Order details are carried in HMAC-SHA256 signed
 * tokens (in the DPO RedirectURL and an httpOnly cookie), signed with
 * ORDER_SIGNING_SECRET. Prices are always recomputed from src/data/events.ts.
 *
 * Before going live, replace this with a real orders table (Supabase/Postgres):
 * persisted status, idempotent "paid" transition, ticket issuing, reconciliation.
 */

export const ORDER_COOKIE = "et_order";

export type OrderItem = { tier: TierId; qty: number };

export interface OrderPayload {
  v: 1;
  /** Our order reference, sent to DPO as CompanyRef. */
  ref: string;
  /** Event id */
  e: number;
  /** Items: [tierId, qty] */
  i: [TierId, number][];
  /** Amount in cents */
  a: number;
  /** Currency */
  c: string;
  /** Issued at (ms) */
  iat: number;
  /** Expires at (ms) */
  exp: number;
}

export interface OrderCookie {
  ref: string;
  /** DPO TransToken bound to this order */
  tok: string;
  /** Buyer display name + email (cookie only, never in URLs) */
  name: string;
  email: string;
  exp: number;
}

export interface ReceiptPayload {
  v: 1;
  ref: string;
  e: number;
  i: [TierId, number][];
  a: number;
  c: string;
  /** DPO approval / transaction ref (non-secret) */
  ap?: string;
  /** paid-at (ms) */
  at: number;
}

type Purpose = "order" | "cookie" | "receipt";

function secret(): Buffer {
  const s = process.env.ORDER_SIGNING_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ORDER_SIGNING_SECRET is missing or too short (min 32 chars)");
  }
  return Buffer.from(s, "utf8");
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function mac(purpose: Purpose, body: string): string {
  return createHmac("sha256", secret()).update(`${purpose}.${body}`).digest("base64url");
}

export function sign(purpose: Purpose, payload: object): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${mac(purpose, body)}`;
}

export function unsign<T extends object>(purpose: Purpose, token: string | null | undefined): T | null {
  if (!token || typeof token !== "string" || token.length > 4096) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: string;
  try {
    expected = mac(purpose, body);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    const exp = (data as { exp?: unknown }).exp;
    if (typeof exp === "number" && Date.now() > exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function newOrderRef(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `ET-${ymd}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export class OrderValidationError extends Error {}

/** Validate requested items and compute the authoritative total (cents). */
export function priceOrder(eventId: unknown, rawItems: unknown) {
  const id = typeof eventId === "number" ? eventId : Number.parseInt(String(eventId), 10);
  const event = Number.isInteger(id) ? getEvent(id) : undefined;
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
