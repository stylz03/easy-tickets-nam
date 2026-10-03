import React from "react";
export default function Logo({ dark = false, className = "", size = "md" }: { dark?: boolean; className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  return <span className={`brand brand-${size} ${dark ? "brand-light" : ""} ${className}`} aria-label="Easy Tickets"><span className="brand-mark" aria-hidden="true"><img src="/brand/easy-tickets-logo.png" alt="" /></span><span className="brand-name">Easy<span>Tickets</span></span></span>;
}
