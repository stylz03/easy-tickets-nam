"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RecoverGuestBooking() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/checkout/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref, email }) });
      const body = await response.json();
      if (body.url) { window.location.assign(body.url); return; }
      setMessage(body.error || "We could not recover that booking.");
    } catch { setMessage("We could not reach Easy Tickets. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="receipt-page"><div className="receipt-content"><article className="receipt-card"><p className="receipt-kicker">GUEST BOOKING</p><h1>Recover your ticket</h1><p className="muted">Enter the order reference shown after payment and the email used at checkout. No account is required.</p><form onSubmit={submit} className="form-stack"><label>Order reference<input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="ET-20261012-XXXXXXXX" required autoCapitalize="characters" /></label><label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" /></label>{message && <p className="form-error" role="alert">{message}</p>}<button className="button primary full" disabled={busy}>{busy ? "Checking payment…" : "Find my booking"}</button></form><Link href="/events" className="text-link">Browse events</Link></article></div></main>;
}
