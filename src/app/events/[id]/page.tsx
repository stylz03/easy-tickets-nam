import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, CalendarDays, Clock3, ArrowLeft } from "lucide-react";
import { catalogue } from "@/lib/catalogue";
import PageFrame from "@/components/site/PageFrame";
import BookingForm from "@/components/site/BookingForm";
export const dynamic = "force-dynamic";
export default async function EventPage({ params }: { params:Promise<{id:string}> }) {
  const { id } = await params; const { events,preview } = await catalogue(); const event = events.find(e => String(e.id)===id); if(!event) notFound();
  return <PageFrame><main id="main" className="wrap page-content"><Link href="/events" className="back-link"><ArrowLeft size={16}/> All events</Link>{preview && <p className="inline-preview">Example event · Design preview</p>}<div className="event-detail-grid"><div><div className="event-detail-image"><img src={event.img} alt={event.title}/><span className="category-label">{event.category}</span></div><h1 className="event-detail-title">{event.title}</h1><div className="event-facts"><span><CalendarDays size={19}/>{event.fullDate}</span><span><Clock3 size={19}/>{event.time}</span><span><MapPin size={19}/>{event.location}</span></div><section className="event-about"><h2>About the event</h2><p>{event.description}</p><h2>Before you go</h2><p>Keep your ticket ready on your phone at the entrance. Each ticket admits one person. Check the event details for your selected ticket type.</p><Link href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="text-link">View venue on map ↗</Link></section></div><BookingForm event={event} preview={preview}/></div></main></PageFrame>;
}
