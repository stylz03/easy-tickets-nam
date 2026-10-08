"use client";
import { useState } from "react";
import { Download, Share2, Printer } from "lucide-react";
export default function TicketActions({id,ticketKey,title}:{id:string;ticketKey:string;title:string}) {
  const [message,setMessage]=useState("");
  async function share(){try {if(navigator.share) await navigator.share({title,text:title,url:window.location.href});else {await navigator.clipboard.writeText(window.location.href);setMessage("Ticket link copied.");}}catch(e){if((e as Error).name!=="AbortError")setMessage("Could not share. Copy the ticket link from your address bar.");}}
  return <><div className="ticket-actions"><a className="button secondary" href={`/api/tickets/${id}/download?key=${ticketKey}`}><Download size={16}/>Save</a><button type="button" className="button secondary" onClick={()=>window.print()}><Printer size={16}/>PDF / Print</button><button type="button" className="button secondary" onClick={share}><Share2 size={16}/>Share</button></div><p className="ticket-caption">Sharing this link grants access to the same one-admission ticket. Keep your QR code private.</p>{message && <p className="ticket-caption" role="status">{message}</p>}</>;
}
