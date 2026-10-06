"use client";

import Link from "next/link";
import { Compass, House, Ticket, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", href: "/", icon: House },
  { label: "Explore", href: "/events", icon: Compass },
  { label: "Tickets", href: "/account/tickets", icon: Ticket },
  { label: "Account", href: "/account", icon: UserRound },
];

export default function MobileDock() {
  const pathname = usePathname();
  return <nav className="mobile-dock" aria-label="App navigation">{items.map(({ label, href, icon: Icon }) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><Icon size={20}/><span>{label}</span></Link>;
  })}</nav>;
}
