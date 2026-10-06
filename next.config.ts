import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async headers() { return [
    { source: "/tickets/:path*", headers: [{key:"Cache-Control",value:"private, no-store"},{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Robots-Tag",value:"noindex, nofollow"}] },
    { source: "/checkout/:path*", headers: [{key:"Cache-Control",value:"private, no-store"},{key:"Referrer-Policy",value:"no-referrer"}] },
    { source: "/sw.js", headers: [{key:"Content-Type",value:"application/javascript; charset=utf-8"},{key:"Cache-Control",value:"no-cache, no-store, must-revalidate"},{key:"Content-Security-Policy",value:"default-src 'self'; script-src 'self'"}] }
  ]; }
};
export default nextConfig;
