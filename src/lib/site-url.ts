import "server-only";

/**
 * Public base URL used to build DPO RedirectURL/BackURL.
 * Priority: NEXT_PUBLIC_SITE_URL / APP_BASE_URL env -> request host -> VERCEL_URL.
 */
export function siteUrl(req?: Request): string {
  // Preserve the hostname the buyer actually used. This is important for
  // staging aliases: a checkout started on staging must return to staging,
  // not to the production URL stored in NEXT_PUBLIC_SITE_URL.
  if (req) {
    const h = req.headers;
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto")?.split(",")[0].trim() ||
        (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}`;
    }
    return new URL(req.url).origin;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL;
  if (env) return env.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
