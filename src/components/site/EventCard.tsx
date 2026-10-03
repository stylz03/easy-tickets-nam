"use client";
import Link from "next/link";
import { ArrowUpRight, MapPin, Heart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventItem } from "@/data/events";
import { useAccount } from "./AccountProvider";
export default function EventCard({ event, saved = false }: { event: EventItem; saved?: boolean }) {
  const { user } = useAccount(); const router = useRouter();
  const [isSaved, setSaved] = useState(saved); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function toggle() {
    if (!user) { router.push(`/auth/sign-in?next=${encodeURIComponent("/account/saved")}`); return; }
    setBusy(true); setError("");
    try { const r = await fetch("/api/account/saved", { method: isSaved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: event.id }) }); if (!r.ok) throw new Error("Could not save this event. Try again."); setSaved(!isSaved); } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <article className="event-card"><div className="event-card-photo"><Link href={`/events/${event.id}`} tabIndex={-1} aria-hidden="true"><img src={event.img} alt="" loading="lazy" /></Link><span className="category-label">{event.category}</span><button className={`save-button ${isSaved ? "saved" : ""}`} aria-label={`${isSaved ? "Unsave" : "Save"} ${event.title}`} aria-pressed={isSaved} disabled={busy} onClick={toggle}><Heart size={18} fill={isSaved ? "currentColor" : "none"} /></button></div><div className="event-card-body"><p className="event-date">{event.fullDate}</p><Link href={`/events/${event.id}`} className="event-title"><h3>{event.title}</h3><ArrowUpRight size={20} /></Link><p className="event-location"><MapPin size={14} />{event.location}</p><p className="event-price">From <strong>N${event.price}</strong> <span>/ person</span></p>{error && <p className="form-error" role="alert">{error}</p>}</div></article>;
}
