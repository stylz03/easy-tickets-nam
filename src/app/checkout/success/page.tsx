import type {Metadata} from "next";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import {verifyRef} from "@/lib/orders";
import {getOrderByRef,amountCents} from "@/lib/orders-db";
import {orderTickets,ticketLink} from "@/lib/tickets";
import PageFrame from "@/components/site/PageFrame";
import BookingCelebration from "@/components/site/BookingCelebration";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Booking confirmed",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function SuccessPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
const p=await searchParams;const ref=typeof p.ref==="string"?p.ref:"";const sig=typeof p.sig==="string"?p.sig:"";const order=verifyRef("receipt",ref,sig)?await getOrderByRef(ref).catch(()=>null):null;
if(!order||order.status!=="paid")return <PageFrame><main id="main" className="wrap page-content"><div className="empty-state"><h1>We couldn’t find that booking.</h1><p>Use the confirmation link from your verified payment.</p><Link href="/events" className="button primary">Back to events</Link></div></main></PageFrame>;
const tickets=await orderTickets(order.id).catch(()=>null);
return <PageFrame><main id="main" className="wrap page-content info-page success-page">{tickets?.length ? <BookingCelebration eventName={order.event_name} count={tickets.length}/> : null}<p className="eyebrow">BOOKING CONFIRMED</p><h1>{tickets?.length ? "You’re in." : "Payment received."}</h1><p className="page-lead">{tickets?.length ? `Your ${tickets.length === 1 ? "ticket is" : "tickets are"} ready for ${order.event_name}.` : `We’re preparing your tickets for ${order.event_name}.`}</p><article className="order-card success-order"><p>{order.ref}</p><h3>{order.event_name}</h3><p>{order.buyer_name} · {order.currency} {(amountCents(order)/100).toFixed(2)}</p></article>{tickets?.length?tickets.map(t=><article className="order-card success-ticket" key={t.id}><div className="order-card-top"><span>{t.tier_name} · Ticket {t.sequence}</span><span className="status-tag">{t.status==="valid"?"Ready for entry":t.status}</span></div><h3>{t.holder_name}</h3><Link className="button primary" href={ticketLink(t)}>Open QR ticket <ArrowUpRight size={17}/></Link></article>):<p className="form-error" role="status">Payment is confirmed, but your tickets are still being prepared. Keep this page and your booking reference.</p>}<p className="success-note">Each QR code admits one person. Keep it private and have it ready at the entrance.</p><Link href="/account/tickets" className="text-link">View all my tickets <ArrowUpRight size={16}/></Link></main></PageFrame>;
}
