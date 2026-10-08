"use client";
import { useEffect, useState } from "react";

export default function NotificationSettings() {
  const [settings, setSettings] = useState({ email_purchased: true, email_saved: false });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushKey, setPushKey] = useState<string | null>(null);
  const [pushActive, setPushActive] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    fetch("/api/account/notifications", { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; })
      .then((body) => setSettings({ email_purchased: body.preferences.email_purchased, email_saved: body.preferences.email_saved }))
      .catch(() => setStatus("Notification settings are unavailable right now."))
      .finally(() => setLoading(false));
    fetch("/api/account/push", { cache: "no-store" }).then((response) => response.json())
      .then(async (body) => {
        setPushKey(body.publicKey ?? null);
        if (body.publicKey && "serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.ready;
          setPushActive(!!(await registration.pushManager.getSubscription()));
        }
      }).catch(() => null);
  }, []);
  async function save() {
    setSaving(true); setStatus("");
    try {
      const response = await fetch("/api/account/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setStatus("Reminder preferences saved.");
    } catch (cause) { setStatus((cause as Error).message); }
    finally { setSaving(false); }
  }
  async function togglePush() {
    if (!pushKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushBusy(true); setStatus("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const response = await fetch("/api/account/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: existing.endpoint }) });
        if (!response.ok) throw new Error("Could not remove this device.");
        await existing.unsubscribe();
        setPushActive(false);
        setStatus("Push reminders stopped on this device.");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error("Notification permission was not granted.");
        const padded = pushKey.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(pushKey.length / 4) * 4, "=");
        const binary = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: binary.buffer });
        const response = await fetch("/api/account/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
        if (!response.ok) { await subscription.unsubscribe(); throw new Error("Could not save this device for push reminders."); }
        setPushActive(true);
        setStatus("Push reminders are on for this device.");
      }
    } catch (cause) { setStatus((cause as Error).message); }
    finally { setPushBusy(false); }
  }
  return <section className="notification-settings"><h3>Event reminders</h3><p className="muted">Choose which events can send you email reminders 48 hours, 24 hours and 2 hours before they start.</p>
    <label><input type="checkbox" checked={settings.email_purchased} disabled={loading} onChange={(event) => setSettings({ ...settings, email_purchased: event.target.checked })} /> Events I bought tickets for</label>
    <label><input type="checkbox" checked={settings.email_saved} disabled={loading} onChange={(event) => setSettings({ ...settings, email_saved: event.target.checked })} /> Events I saved</label>
    <button className="button secondary" disabled={loading || saving} onClick={save}>{saving ? "Saving…" : "Save reminder settings"}</button>
    {pushKey && <><h3>On this device</h3><p className="muted">Push reminders need notification permission. On iPhone, add Easy Tickets to your Home Screen first.</p><button type="button" className="button secondary" disabled={pushBusy} onClick={togglePush}>{pushBusy ? "Working…" : pushActive ? "Turn off push on this device" : "Enable push reminders"}</button></>}
    {status && <p className="muted" role="status">{status}</p>}
  </section>;
}
