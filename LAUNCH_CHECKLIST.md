# Easy Tickets local preview

Recovered GitHub branch: feature/dpo-checkout. All edits are isolated in .preview/design-one. The original checkout and mobile app were not edited.

## Implemented locally

- Light design-one discovery, category/location/search/date filters, event detail and booking.
- Original mobile app ticket logo; self-hosted Inter typography.
- Supabase sign-up, sign-in, password reset, profile, saved events and purchase history.
- Organiser dashboard: drafts/publication, artwork upload, three priced ticket types and capacities, sales, attendee CSV and assigning confirmed staff accounts.
- Trusted organiser membership, private profiles and server-only order/ticket credentials.
- Database reservation with server prices and event row locks. Drafts cannot be purchased.
- DPO hosted checkout and server verification of amount/currency/reference.
- One genuine QR ticket per paid admission; mobile display, SVG download, print-to-PDF and native sharing/copy link.
- Authenticated event-specific staff scanner; atomic single-use admission.
- Protected reconciliation endpoint for payments whose buyer never returns. Expiry/cancellation releases stock only when confirmed by DPO.

## Verified

TypeScript passed. The redesigned site passed focused lint with no errors (image optimisation warnings remain). Seven database/QR tests passed. The full-project lint command still reports errors in the untouched legacy designs and modal components. The production build passed; see final handover for the last verification.
Tests use a temporary local PostgreSQL engine, including access restrictions, capacity/price enforcement, idempotent issuance, QR decoding and scan reuse rejection. They do not connect to the live Supabase project or charge a payment.
Browser visual and camera testing was blocked by automatic approval review reaching its usage limit.

## Connect before launch

1. Inspect the existing Easy Tickets database and compatibility with the existing orders table before applying the two SQL migrations in supabase/migrations. Neither was applied remotely.
2. Fill the publishable key and server-only service-role key in the ignored .env.local. The supplied Easy Tickets URL is already present. Never put service-role, DPO, signing or cron secrets in NEXT_PUBLIC variables.
3. Create the first organisation and owner membership through trusted administration. Users cannot grant themselves organiser access. Managers can assign confirmed staff accounts to their events.
4. Configure Supabase confirmation/reset URLs for the chosen public domain and /auth/callback. Verify customer and organiser account flows.
5. Replace all example events/artwork with real content. Preview mode disables payment when the live database is not configured.
6. Use the provided DPO test settings first. Configure the public return URL; run a complete sandbox purchase, pending/cancelled/expired payment and duplicate-return checks before switching to production credentials.
7. Set a strong CRON_SECRET and schedule authenticated GET /api/jobs/reconcile every few minutes. This endpoint is prepared but no schedule is deployed. Monitor errors/review counts, and manually investigate amount mismatches rather than releasing reserved stock.
8. Configure a transactional email provider and confirmed sender for automatic ticket delivery. Email delivery is not implemented yet.
9. Apple Wallet requires Pass Type ID signing credentials; Google Wallet requires issuer credentials and publishing access. Actual wallet pass generation remains to be implemented once these are available.
10. Test physical camera scanning, mobile layout, accessibility, poor network handling, real payment returns and event-day operations before public launch.

## Explicit limits

Capacity is per ticket type, not a numbered seat map. Shared copies represent the same admission; ownership transfer/revocation is not implemented. Refunds, payouts, tax/legal policies, staff removal UI and platform-wide administration need a separate implementation pass. Organiser sales lists currently show the most recent 1,000 orders and disclose that limit. No production deployment, GitHub push or changes to another Supabase organisation were made.

Run locally: npm run dev -- --port 3100
Preview: http://localhost:3100
Organisers: http://localhost:3100/organiser
Checks: npm run lint; npx tsc --noEmit; npm run build; node --test tests/platform.test.mjs
