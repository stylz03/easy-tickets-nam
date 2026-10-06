import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toDataURL } from "qrcode";
import { ticketByKey,ticketCredential } from "@/lib/tickets";
import Logo from "@/components/Logo";
import PageFrame from "@/components/site/PageFrame";
import TicketActions from "@/components/site/TicketActions";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your event ticket",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function TicketPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {id}=await params;const sp=await searchParams;const key=typeof sp.key==="string"?sp.key:"";
  const ticket=await ticketByKey(id,key);if(!ticket)notFound();
  const qr=await toDataURL(ticketCredential(ticket),{width:360,margin:4,errorCorrectionLevel:"M"});
  return <PageFrame><main id="main" className="ticket-page"><article className="ticket-display"><span className="ticket-halo" aria-hidden="true"/><header><Logo/></header><div className="ticket-body"><p className="eyebrow">{ticket.tier_name} · ONE ADMISSION</p><h1>{ticket.event_name}</h1><p>{ticket.event_date?new Date(ticket.event_date).toLocaleString("en-GB",{timeZone:"Africa/Windhoek",dateStyle:"medium",timeStyle:"short"}):""}</p><p>{ticket.holder_name}</p><span className={`status-tag status-${ticket.status}`}>{ticket.status==="valid"?"Ready for entry":ticket.status==="used"?"Already checked in":"Ticket void"}</span>{ticket.status==="valid" && <div className="ticket-qr-frame"><img className="ticket-qr" src={qr} alt="Your admission QR code"/></div>}<p>Ticket {ticket.id.slice(0,8).toUpperCase()}</p><TicketActions id={id} ticketKey={key} title={ticket.event_name}/></div></article></main></PageFrame>;
}
