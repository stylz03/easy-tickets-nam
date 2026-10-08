import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Logo from "@/components/Logo";
import ReceiptTickets from "@/components/site/ReceiptTickets";
import { verifyRef } from "@/lib/orders";
import { getOrderByRef, amountCents } from "@/lib/orders-db";
import { orderTickets, ticketLink } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking confirmed", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref : "";
  const sig = typeof params.sig === "string" ? params.sig : "";
  const order = verifyRef("receipt", ref, sig) ? await getOrderByRef(ref).catch(() => null) : null;

  if (!order || order.status !== "paid") {
    return <main id="main" className="receipt-page receipt-error"><h1>We couldn’t find that booking.</h1><p>Use the confirmation link from your verified payment.</p><Link href="/events" className="button primary">Browse events</Link></main>;
  }

  const tickets = await orderTickets(order.id).catch(() => []);
  const count = tickets.length;
  const eventWhen = order.event_date
    ? new Date(order.event_date).toLocaleString("en-GB", {
        timeZone: "Africa/Windhoek", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "Event date to be confirmed";
  const mainAction = count === 1 ? ticketLink(tickets[0]) : "#tickets";

  return (
    <main id="main" className="receipt-page">
      <section className="receipt-hero">
        <header className="receipt-topbar">
          <Link href="/" aria-label="Easy Tickets home"><Logo dark /></Link>
          <Link href="/help">Help</Link>
        </header>
        <div className="receipt-hero-copy">
          <span className="receipt-confirmed-mark" aria-hidden="true"><Check size={34} strokeWidth={2.6}/></span>
          <p className="receipt-kicker">BOOKING CONFIRMED</p>
          <h1>{count ? "You’re in." : "Payment received."}</h1>
          <p>{count ? `Your ${count === 1 ? "ticket is" : `${count} tickets are`} ready for ${order.event_name}.` : `We’re preparing your tickets for ${order.event_name}.`}</p>
        </div>
      </section>
      <div className="receipt-content">
        <article className="receipt-card">
          <div className="receipt-event">
            <span>EVENT</span>
            <h2>{order.event_name}</h2>
            <p>{eventWhen}</p>
          </div>
          <div className="receipt-perforation" aria-hidden="true" />
          {count > 0 ? (
            <ReceiptTickets
              initialTickets={tickets.map((ticket) => ({
                id: ticket.id, link: ticketLink(ticket), holderName: ticket.holder_name,
                tierName: ticket.tier_name, status: ticket.status,
              }))}
              refCode={ref}
              signature={sig}
              eventName={order.event_name}
            />
          ) : <p className="receipt-pending">Your payment is confirmed. Keep this reference while your tickets are being prepared.</p>}
          <div className="receipt-facts">
            <div><span>Total paid</span><strong>{order.currency} {(amountCents(order) / 100).toFixed(2)}</strong></div>
            <div><span>Booking reference</span><strong>{order.ref}</strong></div>
          </div>
        </article>
        <div className="receipt-actions">
          {count > 0 && <Link className="button receipt-primary-action" href={mainAction}>{count === 1 ? "View my ticket" : `View all ${count} tickets`}<ArrowRight size={20}/></Link>}
          <div className="receipt-secondary-actions">
            <Link href="/events" className="button">Browse events</Link>
            <Link href={count > 1 ? "#tickets" : "/account/tickets"} className="button">{count > 1 ? "Send to guests" : "My tickets"}</Link>
          </div>
        </div>
        <p className="receipt-privacy">Each QR code admits one person. Share tickets individually and keep your own QR private.</p>
      </div>
    </main>
  );
}
