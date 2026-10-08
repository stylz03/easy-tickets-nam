"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Pencil, Share2 } from "lucide-react";

type ReceiptTicket = {
  id: string;
  link: string;
  holderName: string;
  tierName: string;
  status: "valid" | "used" | "void";
};

export default function ReceiptTickets({
  initialTickets,
  refCode,
  signature,
  eventName,
}: {
  initialTickets: ReceiptTicket[];
  refCode: string;
  signature: string;
  eventName: string;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function saveName(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/tickets/holder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: refCode, sig: signature, ticketId: id, name: draftName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update the name.");
      setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, holderName: result.holderName } : ticket));
      setEditing(null);
      setMessage("Ticket name updated.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function share(ticket: ReceiptTicket, index: number) {
    const url = new URL(ticket.link, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: `${eventName} · Ticket ${index + 1}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage(`Ticket ${index + 1} link copied.`);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") setMessage("Could not share this ticket. Open it and copy its link instead.");
    }
  }

  return (
    <div className="receipt-tickets" id="tickets">
      <div className="receipt-list-heading">
        <h2>{tickets.length === 1 ? "Your ticket" : `Your ${tickets.length} tickets`}</h2>
        <span>One QR code per person</span>
      </div>
      {tickets.map((ticket, index) => (
        <div className="receipt-ticket-row" key={ticket.id}>
          <span className="receipt-ticket-number">{index + 1}</span>
          <div className="receipt-ticket-info">
            {editing === ticket.id ? (
              <form className="receipt-name-form" onSubmit={(event) => { event.preventDefault(); void saveName(ticket.id); }}>
                <label className="sr-only" htmlFor={`ticket-name-${ticket.id}`}>Ticket holder name</label>
                <input id={`ticket-name-${ticket.id}`} value={draftName} onChange={(event) => setDraftName(event.target.value)} minLength={2} maxLength={100} required autoFocus />
                <button type="submit" disabled={busy} aria-label="Save ticket holder name"><Check size={18}/></button>
                <button type="button" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
              </form>
            ) : (
              <>
                <strong>{ticket.holderName}</strong>
                <span>{ticket.tierName}</span>
              </>
            )}
          </div>
          {editing !== ticket.id && (
            <div className="receipt-ticket-controls">
              {ticket.status === "valid" && <button type="button" onClick={() => { setEditing(ticket.id); setDraftName(ticket.holderName); }} aria-label={`Edit holder name for ticket ${index + 1}`}><Pencil size={16}/></button>}
              <button type="button" onClick={() => void share(ticket, index)} aria-label={`Share ticket ${index + 1}`}><Share2 size={16}/></button>
              <Link href={ticket.link} aria-label={`Open ticket ${index + 1}`}><ArrowUpRight size={18}/></Link>
            </div>
          )}
        </div>
      ))}
      {message && <p className="receipt-inline-message" role="status">{message}</p>}
    </div>
  );
}
