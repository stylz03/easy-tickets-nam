const TICKET_ID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const TICKET_SECRET = "[0-9a-f]{64}";
const credentialPattern = new RegExp(`^ET1\\.(${TICKET_ID})\\.(${TICKET_SECRET})$`, "i");
const ticketPathPattern = new RegExp(`/tickets/(${TICKET_ID})/?$`, "i");

export type ParsedTicketCredential = { id: string; secret: string; credential: string };

/**
 * Accepts the native ET1 QR payload as well as an Easy Tickets ticket URL.
 * Supporting the URL form gives gate staff a safe fallback when a customer
 * shares their ticket link instead of presenting the generated QR image.
 */
export function parseTicketCredential(value: unknown): ParsedTicketCredential | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  let id = "";
  let secret = "";
  const direct = credentialPattern.exec(input);
  if (direct) {
    [, id, secret] = direct;
  } else {
    try {
      const url = new URL(input);
      const path = ticketPathPattern.exec(url.pathname);
      const key = url.searchParams.get("key") ?? "";
      if (!path || !new RegExp(`^${TICKET_SECRET}$`, "i").test(key)) return null;
      id = path[1];
      secret = key;
    } catch {
      return null;
    }
  }
  id = id.toLowerCase();
  secret = secret.toLowerCase();
  return { id, secret, credential: `ET1.${id}.${secret}` };
}
