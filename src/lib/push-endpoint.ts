const PUSH_HOSTS = new Set(["fcm.googleapis.com", "fcm-xm.googleapis.com", "web.push.apple.com"]);
export function trustedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && !url.port
      && (PUSH_HOSTS.has(host) || host.endsWith(".push.services.mozilla.com") || host.endsWith(".notify.windows.com"));
  } catch { return false; }
}
