import "server-only";

/**
 * Public base URL used to build DPO RedirectURL/BackURL.
 * Priority: NEXT_PUBLIC_SITE_URL / APP_BASE_URL env -> request host -> VERCEL_URL.
 */
export function siteUrl(req?: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL;
  if (env) return env.replace(/\/+$/, "");
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
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
