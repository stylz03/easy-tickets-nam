"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, Share2, Printer } from "lucide-react";

type OfflineState = "saving" | "ready" | "unsupported" | "error";

export default function TicketActions({ id, ticketKey, title }: { id: string; ticketKey: string; title: string }) {
  const [message, setMessage] = useState("");
  const [offline, setOffline] = useState<OfflineState>("unsupported");

  async function offlineMessage(type: "CACHE_TICKET" | "DELETE_TICKET" | "HAS_TICKET") {
    if (!("serviceWorker" in navigator)) throw new Error("Offline tickets are unavailable in this browser.");
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw new Error("Offline tickets are not ready yet.");
    return new Promise<{ ok: boolean; cached: boolean }>((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = window.setTimeout(() => reject(new Error("Offline save timed out.")), 10000);
      channel.port1.onmessage = (event) => {
        window.clearTimeout(timer);
        if (event.data?.ok) resolve(event.data);
        else reject(new Error("Offline save failed."));
      };
      registration.active?.postMessage({ type, url: window.location.href }, [channel.port2]);
    });
  }

  async function saveOffline() {
    setOffline("saving");
    try {
      const result = await offlineMessage("CACHE_TICKET");
      setOffline(result.cached ? "ready" : "error");
      setMessage(result.cached ? "Ticket saved for offline access on this device." : "Could not save this ticket offline.");
    } catch {
      setOffline("error");
      setMessage("Could not save this ticket offline. Try again while connected.");
    }
  }

  async function removeOffline() {
    try {
      await offlineMessage("DELETE_TICKET");
      setOffline("error");
      setMessage("Offline copy removed from this device.");
    } catch {
      setMessage("Could not remove the offline copy.");
    }
  }

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    offlineMessage("HAS_TICKET")
      .then((result) => setOffline(result.cached ? "ready" : "error"))
      .catch(() => setOffline("error"));
  }, []);

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, text: title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage("Ticket link copied.");
      }
    } catch (cause) {
      if ((cause as Error).name !== "AbortError") setMessage("Could not share. Copy the ticket link from your address bar.");
    }
  }

  return <>
    <div className="ticket-actions">
      <a className="button secondary" href={`/api/tickets/${id}/download?key=${ticketKey}`}><Download size={16} />Save</a>
      <a className="button secondary" href={`/api/tickets/${id}/wallet?key=${ticketKey}`}><CheckCircle2 size={16} />Add to Wallet</a>
      <button type="button" className="button secondary" onClick={() => window.print()}><Printer size={16} />PDF / Print</button>
      <button type="button" className="button secondary" onClick={share}><Share2 size={16} />Share</button>
      {offline !== "unsupported" && (offline === "ready"
        ? <button type="button" className="button secondary" disabled><CheckCircle2 size={16} />Offline ready</button>
        : <button type="button" className="button secondary" onClick={saveOffline} disabled={offline === "saving"}><Download size={16} />{offline === "saving" ? "Saving…" : "Save offline"}</button>)}
    </div>
    <p className="ticket-caption">Sharing this link grants access to the same one-admission ticket. Keep your QR code private.</p>
    {offline === "ready" && <p className="ticket-caption">No data connection is needed to reopen this saved ticket on this device. Remove it after the event if this is a shared device. <button type="button" className="text-link ticket-remove-offline" onClick={removeOffline}>Remove offline copy</button></p>}
    {message && <p className="ticket-caption" role="status">{message}</p>}
  </>;
}
