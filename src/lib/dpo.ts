import "server-only";

/**
 * DPO Pay (3G Direct Pay) API v6 client – server-only.
 *
 * Flow ("Option A"): createToken -> redirect buyer to payment page ->
 * on return, verifyToken server-side.
 *
 * The CompanyToken is read from process.env at call time and is never
 * exposed to the client bundle (this module imports "server-only").
 */

const DEFAULT_API_URL = "https://secure.3gdirectpay.com/API/v6/";
const DEFAULT_PAYMENT_URL = "https://secure.3gdirectpay.com/payv2.php?ID=";

export interface DpoConfig {
  companyToken: string;
  serviceType: string;
  apiUrl: string;
  paymentUrl: string;
  currency: string;
  ptl: number;
  ptlType: "hours" | "minutes";
}

export class DpoConfigError extends Error {}

export function getDpoConfig(): DpoConfig {
  const companyToken = process.env.DPO_COMPANY_TOKEN?.trim();
  const serviceType = process.env.DPO_SERVICE_TYPE?.trim();
  if (!companyToken || !serviceType) {
    throw new DpoConfigError("DPO is not configured (DPO_COMPANY_TOKEN / DPO_SERVICE_TYPE missing)");
  }
  const ptl = Number.parseInt(process.env.DPO_PTL ?? "30", 10);
  const ptlType = process.env.DPO_PTL_TYPE?.trim() === "minutes" ? "minutes" : "hours";
  return {
    companyToken,
    serviceType,
    apiUrl: process.env.DPO_API_URL?.trim() || DEFAULT_API_URL,
    paymentUrl:
      process.env.DPO_PAYMENT_URL?.trim() || process.env.DPO_PAY_URL?.trim() || DEFAULT_PAYMENT_URL,
    currency: (process.env.DPO_CURRENCY?.trim() || "NAD").toUpperCase(),
    ptl: Number.isFinite(ptl) && ptl > 0 ? ptl : 30,
    ptlType,
  };
}

/** Payment time limit in milliseconds (used to expire our signed order). */
export function ptlMs(cfg: DpoConfig): number {
  return cfg.ptl * (cfg.ptlType === "minutes" ? 60_000 : 3_600_000);
}

/** Build the hosted payment page URL for a TransToken. */
export function paymentPageUrl(transToken: string, cfg: DpoConfig = getDpoConfig()): string {
  const base = cfg.paymentUrl;
  if (/[?&]ID=$/i.test(base)) return base + encodeURIComponent(transToken);
  const u = new URL(base);
  u.searchParams.set("ID", transToken);
  return u.toString();
}

/* ------------------------------------------------------------------ */
/*  XML helpers (DPO responses are flat; no dependency needed)         */
/* ------------------------------------------------------------------ */

export function xmlEscape(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlUnescape(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Extract the first <Tag>value</Tag> from an XML string. */
export function xmlTag(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return undefined;
  return xmlUnescape(m[1]).trim();
}

function el(tag: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  return `<${tag}>${xmlEscape(value)}</${tag}>`;
}

async function postXml(cfg: DpoConfig, body: string): Promise<string> {
  const res = await fetch(cfg.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/xml", Accept: "application/xml" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`DPO API HTTP ${res.status}`);
  }
  return text;
}

/* ------------------------------------------------------------------ */
/*  createToken                                                        */
/* ------------------------------------------------------------------ */

export interface CreateTokenInput {
  /** Amount in cents (integer). */
  amountCents: number;
  currency?: string;
  companyRef: string;
  redirectUrl: string;
  backUrl: string;
  serviceDescription: string;
  /** "YYYY/MM/DD HH:MM" */
  serviceDate: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateTokenResult {
  ok: boolean;
  result: string;
  resultExplanation: string;
  transToken?: string;
  transRef?: string;
  paymentUrl?: string;
}

export function formatAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export async function createToken(input: CreateTokenInput): Promise<CreateTokenResult> {
  const cfg = getDpoConfig();
  const currency = (input.currency || cfg.currency).toUpperCase();
  const c = input.customer ?? {};
  const xml =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<API3G>` +
    el("CompanyToken", cfg.companyToken) +
    `<Request>createToken</Request>` +
    `<Transaction>` +
    el("PaymentAmount", formatAmount(input.amountCents)) +
    el("PaymentCurrency", currency) +
    el("CompanyRef", input.companyRef) +
    el("RedirectURL", input.redirectUrl) +
    el("BackURL", input.backUrl) +
    `<CompanyRefUnique>1</CompanyRefUnique>` +
    el("PTL", cfg.ptl) +
    (cfg.ptlType === "minutes" ? `<PTLtype>minutes</PTLtype>` : "") +
    el("customerFirstName", c.firstName) +
    el("customerLastName", c.lastName) +
    el("customerEmail", c.email) +
    el("customerPhone", c.phone) +
    `<TransactionSource>Website</TransactionSource>` +
    `</Transaction>` +
    `<Services><Service>` +
    el("ServiceType", cfg.serviceType) +
    el("ServiceDescription", input.serviceDescription) +
    el("ServiceDate", input.serviceDate) +
    `</Service></Services>` +
    `</API3G>`;

  const resXml = await postXml(cfg, xml);
  const result = xmlTag(resXml, "Result") ?? "";
  const resultExplanation = xmlTag(resXml, "ResultExplanation") ?? "";
  const transToken = xmlTag(resXml, "TransToken");
  const transRef = xmlTag(resXml, "TransRef");
  const ok = result === "000" && !!transToken;
  return {
    ok,
    result,
    resultExplanation,
    transToken,
    transRef,
    paymentUrl: ok && transToken ? paymentPageUrl(transToken, cfg) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  verifyToken                                                        */
/* ------------------------------------------------------------------ */

export interface VerifyTokenResult {
  result: string;
  resultExplanation: string;
  /** Result 000 = Transaction paid */
  paid: boolean;
  transactionAmount?: string;
  transactionCurrency?: string;
  transactionApproval?: string;
  companyRef?: string;
  transactionRef?: string;
  customerName?: string;
}

/** Human labels for the verifyToken result codes we route on. */
export const VERIFY_CODES: Record<string, string> = {
  "000": "Transaction paid",
  "001": "Authorized",
  "002": "Transaction overpaid/underpaid",
  "003": "Pending bank",
  "005": "Queued authorization",
  "007": "Pending split payment",
  "801": "Request missing company token",
  "802": "Company token does not exist",
  "803": "No request or error in request type name",
  "804": "Error in XML",
  "900": "Transaction not paid yet",
  "901": "Transaction declined",
  "902": "Data mismatch",
  "903": "Payment time limit expired",
  "904": "Transaction cancelled",
  "950": "Request missing mandatory fields",
};

export async function verifyToken(transToken: string): Promise<VerifyTokenResult> {
  const cfg = getDpoConfig();
  const xml =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<API3G>` +
    el("CompanyToken", cfg.companyToken) +
    `<Request>verifyToken</Request>` +
    el("TransactionToken", transToken) +
    `<VerifyTransaction>1</VerifyTransaction>` +
    `</API3G>`;
  const resXml = await postXml(cfg, xml);
  const result = xmlTag(resXml, "Result") ?? "";
  return {
    result,
    resultExplanation: xmlTag(resXml, "ResultExplanation") ?? VERIFY_CODES[result] ?? "",
    paid: result === "000",
    transactionAmount: xmlTag(resXml, "TransactionAmount"),
    transactionCurrency: xmlTag(resXml, "TransactionCurrency"),
    transactionApproval: xmlTag(resXml, "TransactionApproval"),
    companyRef: xmlTag(resXml, "CompanyRef"),
    transactionRef: xmlTag(resXml, "TransactionRef"),
    customerName: xmlTag(resXml, "CustomerName"),
  };
}

/** Parse a DPO money string ("150.00") to integer cents. */
export function toCents(amount: string | undefined): number | null {
  if (!amount) return null;
  const n = Number.parseFloat(amount.replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
