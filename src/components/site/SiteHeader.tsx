"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Ticket, UserRound, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useAccount } from "./AccountProvider";
const links = [["Discover", "/events"], ["Music", "/events?category=Music"], ["Culture", "/events?category=Culture"], ["Sport", "/events?category=Sport"], ["Food & drink", "/events?category=Food"]];
export default function SiteHeader() {
  const [open, setOpen] = useState(false); const { user } = useAccount(); const path = usePathname();
  return <header className="site-header"><div className="utility-bar"><div className="wrap"><span>Made for going out in Namibia.</span><div><Link href="/organisers">For organisers <ArrowUpRight size={12} /></Link><Link href="/help">Help centre</Link></div></div></div>
    <div className="wrap header-main"><Link href="/" className="logo-link" onClick={() => setOpen(false)}><Logo /></Link><nav aria-label="Main navigation" className="desktop-nav">{links.map(([label, href]) => <Link className={path === "/events" && label === "Discover" ? "active" : ""} key={label} href={href}>{label}</Link>)}</nav><div className="header-actions"><Link href="/account/tickets" className="tickets-link"><Ticket size={17} /><span>My tickets</span></Link><Link href={user ? "/account" : "/auth/sign-in"} className="account-link"><UserRound size={17} /><span>{user ? "My account" : "Sign in"}</span></Link><button className="icon-button menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div></div>
    {open && <nav className="mobile-nav wrap" aria-label="Mobile navigation">{[...links, ["My tickets", "/account/tickets"], ["Help centre", "/help"]].map(([label, href]) => <Link href={href} key={label} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={16} /></Link>)}</nav>}
  </header>;
}
