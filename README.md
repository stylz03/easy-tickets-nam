# Easy Tickets Namibia

Next.js 16 (App Router) · React 19 · Tailwind v4 · framer-motion · lucide-react.

Routes: `/` (design picker), `/design/1` (chosen design, with live DPO checkout), `/design/2`, `/design/3`,
`/checkout/success|failed|cancelled`, `/api/checkout`, `/api/dpo/return`.

## DPO Pay (3G Direct Pay) checkout – sandbox

Flow ("Option A"):

1. **Design 1 → Book Now** opens the booking panel: event details → ticket tiers/qty → buyer name, email, phone.
2. **`POST /api/checkout`** validates the input, **recomputes the total server-side** from `src/data/events.ts`,
   calls DPO `createToken` (ServiceType from env, CompanyRef = order ref, `CompanyRefUnique=0`) and returns the
   hosted payment page URL `https://secure.3gdirectpay.com/payv2.php?ID=<TransToken>`. The browser is redirected there.
3. DPO redirects back to **`GET /api/dpo/return?ref=…&sig=…`** (RedirectURL; BackURL is the same handler with `back=1`).
   The handler loads the order from **Supabase** by its HMAC-signed ref, checks DPO's `TransactionToken`/`CompanyRef`
   params against the stored row, calls **`verifyToken` server-side** with the stored token, and requires Result `000`
   **and** an amount + currency match with the DB row before marking it `paid`. Updates are conditional, so `paid` is
   never downgraded and repeat hits are idempotent. Then → `/checkout/success?ref&sig` (read from the DB),
   `/checkout/cancelled` (BackURL / 904) or `/checkout/failed`. `900` (not paid yet) leaves the order `pending`.

### Orders (Supabase)

`supabase/migrations/*_orders.sql` creates `public.orders` (status `pending|paid|failed|cancelled`, unique `ref` and
`dpo_trans_token`, indexes on status and buyer_email). **RLS is enabled with no policies** and anon/authenticated have no
grants, so only the server (service role, `src/lib/supabase-admin.ts`) can read or write it.

HMAC signing (`ORDER_SIGNING_SECRET`) is kept, but only for *capability links*: the ref in the DPO return URLs and in
the success/cancelled links is signed so refs can't be enumerated to view other buyers' orders. Order data itself is
no longer carried in signed tokens or cookies; the DB is the source of truth.

Key files: `src/lib/dpo.ts` (server-only XML client), `src/lib/orders.ts` (pricing + signed refs), `src/lib/orders-db.ts`, `src/lib/supabase-admin.ts`,
`src/app/api/checkout/route.ts`, `src/app/api/dpo/return/route.ts`, `src/app/checkout/*`, `src/data/events.ts`.

### Environment (server-only – see `.env.example`)

| Var | Notes |
|---|---|
| `DPO_COMPANY_TOKEN` | **Secret.** Never prefix with `NEXT_PUBLIC_`. |
| `DPO_SERVICE_TYPE` | Service type id for the account (e.g. 3854) |
| `DPO_API_URL` | `https://secure.3gdirectpay.com/API/v6/` |
| `DPO_PAYMENT_URL` (or `DPO_PAY_URL`) | `https://secure.3gdirectpay.com/payv2.php?ID=` |
| `DPO_CURRENCY` | `NAD` (confirm with DPO for the account) |
| `DPO_PTL` / `DPO_PTL_TYPE` | Payment time limit (default 30, hours) |
| `ORDER_SIGNING_SECRET` | **Secret.** ≥32 random chars (`openssl rand -base64 48`) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Service role key – server only, never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` / `APP_BASE_URL` | Optional public base URL for Redirect/BackURL; defaults to the request host |

Local dev: `cp .env.example .env.local`, fill in, `npm run dev`.
DPO's edge (CloudFront WAF) **rejects createToken requests whose RedirectURL contains `localhost`**, so locally set
`APP_BASE_URL` to a public URL (or a tunnel such as cloudflared/ngrok) – the return leg only works on a public host.

Sandbox test card: Mastercard `5436 8862 6984 8367`, any future expiry, CVV `123`.

### ⚠️ Before going live

- Ticket issuing: email the buyer a ticket with a QR code once an order is `paid`, plus a scan/check-in flow.
- A reconciliation cron (e.g. Vercel Cron every 10–15 min) running `verifyToken` on `pending` orders that have a token,
  to catch buyers who paid but closed the tab before the redirect, and to expire stale ones.
- Inventory/capacity limits per event and tier.
- Production env vars (live DPO credentials, Supabase, signing secret).
- Replace the placeholder events/prices in `src/data/events.ts` with real data.
- Swap to the LIVE DPO credentials DPO issues after they review the test link.
- Add rate limiting to `/api/checkout`.
