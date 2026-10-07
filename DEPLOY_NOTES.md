# Design 1 live source handover

## Source and boundaries
Branch: design-1-live, based on deployed source commit 834430c.
Working copy: .preview/design-one within the laptop project.
The handover commit contains the original deployed source, database migrations, seed data, deployment notes and local database tests. Later commits may refine the application while preserving this baseline in Git history.

The 2026-10-03 production promotion rebuilt this source. The public alias is https://easyticketsnam.vercel.app. Production remains in preview mode while Supabase setup, real event allocations and end-to-end checkout testing are completed.

## Environment inventory
.env.example contains every environment name directly read by this app, with empty values. Empty template values are not operational settings.

| Variable | Scope and purpose |
| --- | --- |
| SUPABASE_URL | Server only. Existing Easy Tickets project's API URL; same project as the public URL. |
| SUPABASE_SERVICE_ROLE_KEY | Server secret. Used for catalogue, orders, tickets and authenticated organiser uploads. Never expose publicly. |
| NEXT_PUBLIC_SUPABASE_URL | Public, baked into browser build. Supabase Auth endpoint. |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public key preferred by Auth clients. |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public legacy fallback when publishable key is absent. Only one public-key variable needs configuration. |
| EASY_TICKETS_PREVIEW | Server. Literal true returns example catalogue and prevents admin-client access. Remove or set false only after schema and configuration are ready. |
| NEXT_PUBLIC_EASY_TICKETS_PREVIEW | Public build flag. Literal true disables Auth clients and cookie refresh. Change together with the server preview flag and rebuild. |
| DPO_COMPANY_TOKEN | Server secret from DPO. Set the live Company ID in Production and the test token in Preview; never expose either in a public variable or commit. |
| DPO_SERVICE_TYPE | Server. DPO assigned service ID. The live Events Ticketing service type is 114161; Preview can retain test service ID 5525. |
| DPO_API_URL | Server optional override; default https://secure.3gdirectpay.com/API/v6/. |
| DPO_PAYMENT_URL | Server optional hosted payment URL; default https://secure.3gdirectpay.com/payv2.php?ID=. |
| DPO_PAY_URL | Server legacy fallback for DPO_PAYMENT_URL. |
| DPO_CURRENCY | Server. Default NAD. Prices in this catalogue are NAD. |
| DPO_PTL | Server. Positive integer payment time limit; default 30. |
| DPO_PTL_TYPE | Server. Literal minutes selects minutes; otherwise hours. Default is hours, so choose deliberately. |
| ORDER_SIGNING_SECRET | Server secret, minimum 32 characters; signs DPO return and receipt links. Keep stable across redeploys to preserve existing links. |
| CRON_SECRET | Server secret. Exact Bearer credential for reconciliation. |
| NEXT_PUBLIC_SITE_URL | Public canonical origin, preferred when generating DPO return URLs. Set to https://easyticketsnam.vercel.app or the eventual custom domain. |
| APP_BASE_URL | Server alternative to NEXT_PUBLIC_SITE_URL. Public variable takes precedence. |
| VERCEL_URL | Platform-provided hostname, used as URL fallback when there is no explicit origin or request. Not a secret. |

Do not commit configuration values. Keep .env/.env.local/.env.*.local and .vercel/ ignored. Provide secret values securely through the future deployment environment.

## Database setup and migration order
These are the complete application migrations, unchanged from the deployed source:
1. supabase/migrations/20261003110000_orders.sql
   - orders, status constraints and indexes, updated_at trigger, private server-only RLS/grants.
2. supabase/migrations/20261003160000_website_platform.sql
   - website_organisations, website_organiser_members (owner/manager), website_profiles, website_events, website_saved_events, website_event_staff, website_tickets; order user ownership.
   - Ticket tiers, prices, perks and capacities are JSONB under website_events.payload.tiers, not a separate tier table. Categories, cities and home navigation are code-defined, with no lookup table required.
   - RLS policies, role grants and sequence grants.
   - save_website_event, reserve_website_order, issue_website_tickets and its paid-order trigger, assign_website_event_staff, check_in_website_ticket, website_catalogue.
   - Public event-artwork storage bucket.

Apply in filename timestamp order, then supabase/seed.sql to an empty APPLICATION schema. On an existing database, first check which migrations were already applied; the website migration is intentionally not rerunnable. Do not run migration SQL twice outside a migration manager.

### Platform prerequisites and local validation
A fresh Supabase installation provides auth.users, auth.uid(), storage.buckets and the anon/authenticated/service_role roles. A completely bare PostgreSQL instance lacks them and cannot run these Supabase-specific application migrations without platform setup.
The local test starts a fresh embedded PostgreSQL instance and creates minimal platform fixtures from tests/fixtures/supabase-platform.sql, then applies ALL application migrations in order and runs the seed twice. This is a SQL integration test, not a Supabase Auth/Storage service emulator. Never apply the test fixture to a Supabase project.
No standalone PostgreSQL server/Docker or running Supabase stack was used for this handover, and no dashboard schema was inspected remotely.

Run: node --test tests/platform.test.mjs tests/migrations-seed.test.mjs

## Seed contents
Six events (IDs 1-6), all display fields, artwork paths, times, descriptions, tier names/perks and prices copied from src/data/events.ts:
| Event | Displayed date | Standard / Premium / VIP (NAD) |
| --- | --- | --- |
| Windhoek Cultural Festival | October 17, 2026 | 150 / 350 / 600 |
| Desert Dune Music Fest | November 14, 2026 | 250 / 350 / 600 |
| Namibian Food & Wine Expo | December 6, 2026 | 100 / 350 / 600 |
| Etosha Trail Marathon | January 17, 2027 | 200 / 350 / 600 |
| Coastal Jazz Weekend | February 13-14, 2027 | 180 / 350 / 600 |
| Windhoek Comedy Night | February 26, 2027 | 120 / 350 / 600 |

Start timestamps are Namibia time (+02:00). Overnight and multi-day display text is preserved; no new end timestamps have been guessed because the original catalogue does not define endsAt.
The seed creates a single Easy Tickets Namibia organisation, deterministic UUID e4510000-0000-4000-8000-000000000001, and publishes these events. It creates no users, passwords, staff or manager grants. It uses conflict DO NOTHING to avoid overwriting existing rows and keeps organiser-created IDs in the 1000+ range.

IMPORTANT: the public preview supplies no ticket capacities. Seed capacities are explicitly zero so no invented stock can be sold. A trusted organiser must set actual capacities and event end times before sales. The displayed content is the current site's example catalogue, not independently verified event scheduling.
The seed test compares every original display field and all 18 tier prices against source, checks bucket settings, catalogue availability and repeated-seed safety.

## Organiser/account provisioning
Use Supabase Auth to create and confirm real customer, organiser and staff accounts.
After an organiser exists in auth.users, use trusted administration to add that user's UUID to website_organiser_members for the seed organisation with role owner or manager. Users cannot self-grant membership.
Profiles are written through the account API; no separate profile-creation trigger is required by the app. Event managers assign confirmed staff email accounts through the organiser API. Staff can only check in assigned event tickets.
Do not grant end users service_role or direct access to order/ticket secrets.

## Storage
Bucket: website-event-images, public, 8 MiB limit (8388608 bytes); PNG, JPEG and WebP.
The upload API verifies the manager's organisation, file size and binary image signature, then uploads using the server service-role key to organisation-UUID/random-UUID.ext.
There are no direct client upload/delete policies on storage.objects. Public bucket downloads serve event artwork; server service-role uploads bypass object RLS. No private ticket or buyer data belongs in this public bucket.
Existing seeded artwork is served from repository public/images/design1; it does not require uploads or extra buckets. No wallet-pass bucket or email provider integration exists yet.

## Supabase Auth settings
Enable Email/password signup and sign-in. This app does not expose Google, Apple or other social/OAuth sign-in flows; those providers are not required.
Enable email confirmations and provide production SMTP/sender configuration for confirmation and password-reset messages. The UI requires a minimum 10-character new password; configure Auth consistently.
Set Site URL to https://easyticketsnam.vercel.app (change when the custom domain is chosen).
Allow redirect URLs for:
- https://easyticketsnam.vercel.app/auth/callback and its next query variants.
- The chosen custom-domain /auth/callback and query variants when added.
- Only the Vercel preview origins actually used for testing, with their /auth/callback variants.
- http://localhost:3100/auth/callback and variants for local testing.
The signup form requests /auth/callback?next=<internal path>; password reset uses /auth/callback?next=%2Fauth%2Fupdate-password. The callback exchanges a PKCE code and then allows only safe internal next paths. Ensure confirmation/recovery email templates preserve Supabase's confirmation/redirect flow so the callback receives code. Test both email flows before enabling accounts publicly.
Standard confirmation/reset emails are distinct from ticket-delivery email: automatic ticket emailing is unfinished.

## DPO and reconciliation
DPO uses createToken -> hosted checkout -> server verifyToken. The integration sends a unique company reference, identifies the transaction source as Website, and explicitly requests transaction verification. Amount/currency/order reference are verified before paying an order, and the database issues one ticket per admission transactionally. Return URLs use /api/dpo/return with signed ref and sig; they require the canonical public origin and a stable signing secret.

On 2026-10-06, the original test credentials returned result 802, `Company is not active`. On 2026-10-07, DPO supplied the live Company ID and Events Ticketing service type 114161. A direct live API smoke test created a synthetic NAD 1.00 transaction (result 000), verified that it was unpaid (result 900), and cancelled its token (result 000). No customer details or card data were submitted, and no charge was made. This validates the live API credentials and create/verify/cancel calls, but it does not validate a completed payment or ticket issuance.

The live Company ID and service type, plus a 30-minute payment time limit, have been added as encrypted server-only Vercel Production environment variables. Preview retains the test merchant. Production preview flags remain enabled, so the public checkout still returns 503. Redeploy after environment changes to make them effective; keep preview mode until the Easy Tickets Supabase project has the migrations, real ticket capacities, Auth/email settings and a successful end-to-end test purchase.

This Next.js application uses DPO's API directly. The customer completes card entry on DPO's hosted payment page; the site owns the order form, redirect, return verification and ticket screen. A WordPress shopping-cart plugin is unnecessary. Ask DPO whether current merchant settings allow branding the hosted payment page with the Easy Tickets logo and colours; do not collect card numbers in the application.

Schedule authenticated GET /api/jobs/reconcile with Authorization: Bearer <CRON_SECRET> after live configuration is ready. Missing secret returns 503; incorrect/missing credential returns 401. No cron schedule is included or deployed by this handover.
Use a cadence appropriate to purchase volume (for example every few minutes), with an execution limit compatible with the 60-second route limit. Each invocation handles up to 10 oldest-updated pending orders, with parallel gateway checks.
It verifies saved DPO tokens even if buyers never return. Confirmed expiry/cancellation releases stock. No-token orders older than 10 minutes are closed. Gateway-declared paid orders with amount mismatches stay reserved for manual review. Monitor checked/paid/closed/review/errors counters; review/errors require investigation.
Do not activate a scheduler while preview mode is true. The admin client deliberately blocks live database access in that mode.

## Known scope
The app includes an installable manifest, branded app icons, a mobile navigation dock and a service worker that caches only public static assets. It deliberately does not cache HTML, checkout responses, account data or QR-ticket pages. The service worker can display and safely open same-origin push payloads, but subscription storage and delivery are not active until VAPID keys, a Supabase subscription table and a notification sender are added.

Apple Wallet and Google Wallet passes are not active. Apple requires an Apple Developer Pass Type ID, signing certificate/private key and WWDR certificate. Google requires an approved Wallet issuer account, service-account credentials and an event-ticket class. Add those credentials as server-only deployment secrets, generate one signed pass/object per issued ticket, and show wallet actions only after the relevant provider returns a valid pass. The existing QR page, download, print/PDF and share actions remain the working ticket options.

Ticket-delivery emails, controlled ticket transfers, refunds/payouts and numbered seat maps remain unfinished.
