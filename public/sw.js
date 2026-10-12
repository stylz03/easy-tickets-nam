const CACHE = "easy-tickets-shell-v2";
const TICKET_CACHE = "easy-tickets-offline-tickets-v1";
const ASSETS = ["/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png", "/brand/easy-tickets-logo.png", "/fonts/inter-latin.woff2"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== TICKET_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate" && url.pathname.startsWith("/tickets/")) {
    event.respondWith(fetch(request).catch(() => caches.open(TICKET_CACHE).then((cache) => cache.match(request, { ignoreVary: true })).then((cached) => cached || Response.error())));
    return;
  }
  if (!["image", "font", "style", "script"].includes(request.destination)) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (!["CACHE_TICKET", "DELETE_TICKET", "HAS_TICKET"].includes(data.type)) return;
  event.waitUntil((async () => {
    try {
      const url = new URL(data.url, self.location.origin);
      if (url.origin !== self.location.origin || !url.pathname.startsWith("/tickets/") || !url.searchParams.has("key")) throw new Error("Invalid ticket URL");
      const cache = await caches.open(TICKET_CACHE);
      const request = new Request(url.href, { credentials: "include", headers: { Accept: "text/html" } });
      if (data.type === "CACHE_TICKET") {
        const response = await fetch(request);
        if (!response.ok) throw new Error("Ticket could not be saved");
        await cache.put(request, response);
        event.ports[0]?.postMessage({ ok: true, cached: true });
      } else if (data.type === "DELETE_TICKET") {
        await cache.delete(request, { ignoreVary: true });
        event.ports[0]?.postMessage({ ok: true, cached: false });
      } else {
        const cached = await cache.match(request, { ignoreVary: true });
        event.ports[0]?.postMessage({ ok: true, cached: !!cached });
      }
    } catch {
      event.ports[0]?.postMessage({ ok: false, cached: false });
    }
  })());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { body: event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || "Easy Tickets", {
    body: data.body || "You have an update.",
    icon: "/pwa/icon-192.png",
    badge: "/pwa/icon-192.png",
    data: { url: data.url || "/account/tickets" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/account/tickets", self.location.origin);
  const safeUrl = target.origin === self.location.origin ? target.href : new URL("/account/tickets", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const open = windows.find((client) => client.url === safeUrl && "focus" in client);
    return open ? open.focus() : self.clients.openWindow(safeUrl);
  }));
});
