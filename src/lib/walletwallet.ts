import type { Admission } from "@/lib/tickets";
import { ticketCredential } from "@/lib/tickets";

const API_URL = "https://api.walletwallet.dev/api/passes";

export type WalletWalletPass = { serialNumber: string; googleSaveUrl: string; shareUrl: string; applePass?: string };

export function walletWalletEnabled() {
  return process.env.EASY_TICKETS_WALLETS_ENABLED === "true" && Boolean(process.env.WALLETWALLET_API_KEY);
}

function siteUrl() {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")).replace(/\/$/, "");
}

function absoluteAsset(path: string) {
  const base = siteUrl();
  return base ? `${base}${path}` : undefined;
}

function expiry(ticket: Admission) {
  if (!ticket.event_date) return undefined;
  const date = new Date(ticket.event_date);
  return Number.isNaN(date.valueOf()) || date <= new Date() ? undefined : date.toISOString();
}

export async function createWalletWalletPass(ticket: Admission, eventImage?: string): Promise<WalletWalletPass> {
  const apiKey = process.env.WALLETWALLET_API_KEY;
  if (!apiKey) throw new Error("WalletWallet is not configured.");
  const payload = {
    barcodeValue: ticketCredential(ticket), barcodeFormat: "QR", barcodeAltText: `ET · ${ticket.id.slice(0, 8).toUpperCase()}`,
    logoText: "Easy Tickets", organizationName: "Easy Tickets Namibia", description: `Entry ticket for ${ticket.event_name}`,
    primaryFields: [{ label: "EVENT", value: ticket.event_name }],
    secondaryFields: [{ label: "TICKET", value: ticket.tier_name }, { label: "HOLDER", value: ticket.holder_name }],
    backFields: [
      { label: "DATE", value: ticket.event_date ? new Date(ticket.event_date).toLocaleString("en-GB", { timeZone: "Africa/Windhoek", dateStyle: "full", timeStyle: "short" }) : "Date to be confirmed" },
      { label: "ENTRY", value: "One admission. Show this pass at the entrance." },
    ],
    colorPreset: "blue", logoURL: absoluteAsset("/brand/easy-tickets-logo.png"), backgroundURL: eventImage || undefined, expirationDate: expiry(ticket), sharingProhibited: true,
  };
  const response = await fetch(API_URL, {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))), cache: "no-store",
  });
  const result = await response.json().catch(() => null) as Partial<WalletWalletPass> | null;
  if (!response.ok || !result?.serialNumber || !result.shareUrl || !result.googleSaveUrl) throw new Error(response.status === 429 ? "Wallet pass limit reached for this month." : "Wallet pass could not be created.");
  return { serialNumber: result.serialNumber, shareUrl: result.shareUrl, googleSaveUrl: result.googleSaveUrl, applePass: result.applePass };
}
