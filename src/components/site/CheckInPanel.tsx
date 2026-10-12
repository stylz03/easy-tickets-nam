"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { browserSupabase } from "@/lib/supabase/client";
import { parseTicketCredential } from "@/lib/ticket-credential";
import { useAccount } from "./AccountProvider";

type AssignedEvent = { id: number; title: string };
type RecentAdmission = { holder: string; tier: string; time: string };

async function accessToken() {
  const { data, error } = await browserSupabase().auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Your check-in session has expired. Please sign in again.");
  }
  return data.session.access_token;
}

export default function CheckInPanel() {
  const { user, configured, loading } = useAccount();
  const userId = user?.id;
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [eventId, setEventId] = useState("");
  const [credential, setCredential] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [reload, setReload] = useState(0);
  const [camera, setCamera] = useState(false);
  const [recent, setRecent] = useState<RecentAdmission[]>([]);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);

  async function switchAccount() {
    controls.current?.stop();
    await browserSupabase().auth.signOut();
    window.location.assign("/auth/sign-in?next=/check-in");
  }

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      try {
        await Promise.resolve();
        if (!active) return;
        setLoadingEvents(true);
        setError("");
        const token = await accessToken();
        const response = await fetch("/api/check-in", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load assigned events.");
        if (!active) return;
        const assigned = (result.events ?? []) as AssignedEvent[];
        setEvents(assigned);
        setEventId((current) => assigned.some((event) => String(event.id) === current)
          ? current : assigned.length === 1 ? String(assigned[0].id) : "");
      } catch (cause) {
        if (active) {
          setEvents([]);
          setEventId("");
          setError((cause as Error).message);
        }
      } finally {
        if (active) setLoadingEvents(false);
      }
    })();
    return () => { active = false; };
  }, [userId, reload]);

  useEffect(() => () => { controls.current?.stop(); }, []);

  async function start() {
    setError("");
    setMessage("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera scanning needs a secure HTTPS connection. Paste the ticket code below on this device.");
      return;
    }
    setCamera(true);
    try {
      if (!video.current) throw new Error("Camera unavailable.");
      const reader = new BrowserQRCodeReader();
      controls.current = await reader.decodeFromConstraints({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      }, video.current, (result, _error, scannerControls) => {
        if (result) {
          const parsed = parseTicketCredential(result.getText());
          if (!parsed) {
            setMessage("That QR is not an Easy Tickets ticket. Keep the camera pointed at the ticket code.");
            return;
          }
          setCredential(parsed.credential);
          scannerControls.stop();
          setCamera(false);
          setMessage("Code read. Check the selected event, then admit the ticket.");
          navigator.vibrate?.(60);
        }
      });
    } catch (cause) {
      setCamera(false);
      const denied = cause instanceof DOMException && cause.name === "NotAllowedError";
      setError(denied ? "Camera access was blocked. Allow it in your browser settings, or paste the ticket code below." : "Camera unavailable. Paste the ticket code below or try another device.");
    }
  }

  async function admit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ credential, eventId: Number(eventId) }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Ticket not valid for this event.");
      setMessage(`Admitted: ${result.holder} · ${result.tier}`);
      setRecent((items) => [{ holder: result.holder, tier: result.tier, time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }, ...items].slice(0, 5));
      navigator.vibrate?.([80, 40, 80]);
      setCredential("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (!user) return <div className="empty-state">
    <h2>Staff access only</h2>
    <p>{configured ? "Sign in with the account assigned to this event." : "Check-in services are awaiting the Easy Tickets connection."}</p>
    <Link className="button primary" href="/auth/sign-in?next=/check-in">Sign in</Link>
  </div>;

  return <div className="auth-card">
    <h2>Event check-in</h2>
    <p className="muted">Signed in as {user.email}. Your assigned event appears below.</p>
    <form className="form-stack" onSubmit={admit}>
      <label>Event
        <select required value={eventId} disabled={loadingEvents || !events.length} onChange={(event) => {
          controls.current?.stop();
          setCamera(false);
          setCredential("");
          setMessage("");
          setEventId(event.target.value);
        }}>
          <option value="">{loadingEvents ? "Loading events…" : "Choose event"}</option>
          {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
      </label>
      <video ref={video} hidden={!camera} style={{ width: "100%" }} muted playsInline />
      {camera && <p className="inline-preview" role="status">Point the rear camera at the full square QR code. Scanning happens automatically.</p>}
      <button type="button" className="button secondary" disabled={!eventId || busy || camera} onClick={start}>Scan QR with camera</button>
      {camera && <button type="button" className="button secondary" onClick={() => { controls.current?.stop(); setCamera(false); }}>Stop camera</button>}
      <label>Ticket code
        <textarea required autoCapitalize="none" autoCorrect="off" spellCheck={false} value={credential} onChange={(event) => setCredential(event.target.value)} onBlur={() => {
          const parsed = parseTicketCredential(credential);
          if (parsed) setCredential(parsed.credential);
        }} placeholder="Scan a QR code, or paste the ET1 ticket code or ticket link." rows={3} />
      </label>
      {error && <p className="form-error" role="alert">{error}{error.toLowerCase().includes("sign in") && <> <Link href="/auth/sign-in?next=/check-in">Sign in again</Link></>}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <button className="button primary" disabled={!eventId || busy || !credential}>{busy ? "Checking…" : "Check ticket & admit"}</button>
    </form>
    {loadingEvents && <p className="inline-preview" role="status">Loading assigned events…</p>}
    {!loadingEvents && !error && !events.length && <p className="inline-preview">No events are assigned to {user.email}. Ask your event manager to assign this exact email address.</p>}
    <button type="button" className="button secondary" disabled={loadingEvents} onClick={() => setReload((current) => current + 1)}>Refresh assignments</button>
    {!loadingEvents && !events.length && <button type="button" className="button secondary" onClick={switchAccount}>Sign in with another staff account</button>}
    {!!recent.length && <section className="check-in-recent" aria-labelledby="recent-check-ins"><h3 id="recent-check-ins">Checked in on this device</h3><ul>{recent.map((item, index) => <li key={`${item.time}-${index}`}><span><strong>{item.holder}</strong><small>{item.tier}</small></span><time>{item.time}</time></li>)}</ul></section>}
  </div>;
}
