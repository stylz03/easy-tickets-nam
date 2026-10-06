import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Easy Tickets Namibia",
    short_name: "Easy Tickets",
    description: "Discover events and keep your tickets ready for entry.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f5f6fb",
    theme_color: "#164dcc",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Browse events", short_name: "Events", url: "/events", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
      { name: "My tickets", short_name: "Tickets", url: "/account/tickets", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
