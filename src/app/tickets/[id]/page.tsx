import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toDataURL } from "qrcode";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ticketByKey, ticketCredential } from "@/lib/tickets";
import Logo from "@/components/Logo";
import TicketActions from "@/components/site/TicketActions";
import EntryMode from "@/components/site/EntryMode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your event ticket", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function TicketPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const key = typeof sp.key === "string" ? sp.key : "";
  const ticket = await ticketByKey(id, key);
  if (!ticket) notFound();
  const qr = await toDataURL(ticketCredential(ticket), { width: 480, margin: 4, errorCorrectionLevel: "M" });
  const date = ticket.event_date ? new Date(ticket.event_date) : null;
  const dateText = date ? date.toLocaleDateString("en-GB", { timeZone: "Africa/Windhoek", weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "Date to be confirmed";
  const timeText = date ? date.toLocaleTimeString("en-GB", { timeZone: "Africa/Windhoek", hour: "2-digit", minute: "2-digit" }) : "Time to be confirmed";
  const shortCode = ticket.id.slice(0, 8).toUpperCase();

  return <main id="main" className="admission-page">
    <header className="admission-topbar">
      <Link href="/account/tickets" className="admission-back" aria-label="Back to my tickets"><ArrowLeft size={20}/></Link>
      <Link href="/" aria-label="Easy Tickets home"><Logo dark /></Link>
      <span className="admission-topbar-spacer" />
    </header>
    <div className="admission-content">
      <p className="admission-kicker">YOUR TICKET</p>
      <h1>Ready when you are.</h1>
      <p className="admission-intro">Everything you need for entry is right here.</p>
      <article className="admission-ticket">
        <div className="admission-ticket-head">
          <p>{ticket.tier_name} <span>·</span> ONE ADMISSION</p>
          <h2>{ticket.event_name}</h2>
          <div className="admission-datetime"><div><span>DATE</span><strong>{dateText}</strong></div><div><span>TIME</span><strong>{timeText}</strong></div></div>
        </div>
        <div className="admission-perforation" aria-hidden="true" />
        <div className="admission-ticket-body">
          <span className={`admission-status admission-status-${ticket.status}`}><ShieldCheck size={15}/>{ticket.status === "valid" ? "Ready for entry" : ticket.status === "used" ? "Already checked in" : "Ticket void"}</span>
          {ticket.status === "valid" && <EntryMode qr={qr} eventName={ticket.event_name} dateText={dateText} timeText={timeText} holderName={ticket.holder_name} shortCode={shortCode} />}
          <p className="admission-code">ET · {shortCode}</p>
          <div className="admission-holder"><span>TICKET HOLDER</span><strong>{ticket.holder_name}</strong></div>
        </div>
      </article>
      <TicketActions id={id} ticketKey={key} title={ticket.event_name}/>
      <p className="admission-footnote">Show the QR code at the entrance. One scan admits one person.</p>
    </div>
  </main>;
}
