import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async headers() { return [
    { source: "/tickets/:path*", headers: [{key:"Cache-Control",value:"private, no-store"},{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Robots-Tag",value:"noindex, nofollow"}] },
    { source: "/checkout/:path*", headers: [{key:"Cache-Control",value:"private, no-store"},{key:"Referrer-Policy",value:"no-referrer"}] }
  ]; }
};
export default nextConfig;
