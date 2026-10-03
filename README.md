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
3. DPO redirects back to **`GET /api/dpo/return`** (RedirectURL; BackURL is the same handler with `back=1`).
   The handler never trusts query params: it checks our HMAC-signed order, checks the `TransactionToken` against the
   signed httpOnly cookie, calls **`verifyToken` server-side**, and requires Result `000` **and** matching
   amount + currency before redirecting to `/checkout/success` (with a signed receipt).
   Otherwise → `/checkout/failed` (or `/checkout/cancelled` for BackURL / result 904).

Key files: `src/lib/dpo.ts` (server-only XML client), `src/lib/orders.ts` (pricing + HMAC-signed order tokens),
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
| `NEXT_PUBLIC_SITE_URL` / `APP_BASE_URL` | Optional public base URL for Redirect/BackURL; defaults to the request host |

Local dev: `cp .env.example .env.local`, fill in, `npm run dev`.
DPO's edge (CloudFront WAF) **rejects createToken requests whose RedirectURL contains `localhost`**, so locally set
`APP_BASE_URL` to a public URL (or a tunnel such as cloudflared/ngrok) – the return leg only works on a public host.

Sandbox test card: Mastercard `5436 8862 6984 8367`, any future expiry, CVV `123`.

### ⚠️ Before going live

- **A database is required** (Supabase / Postgres). The sandbox build is stateless: order details live in HMAC-signed
  tokens (RedirectURL + httpOnly cookie). Live needs an `orders` table (pending → paid idempotently, TransToken,
  TransRef, buyer, amounts), ticket issuing/emailing with QR codes, inventory/capacity, and a reconciliation job that
  runs `verifyToken` on stale pending orders (customers who close the tab before the redirect).
- Replace the placeholder events/prices in `src/data/events.ts` with real data.
- Swap to the LIVE DPO credentials DPO issues after they review the test link.
- Add rate limiting to `/api/checkout`.
