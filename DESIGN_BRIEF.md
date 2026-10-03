# Easy Tickets design-one rebuild
Prepared 3 October 2026.

## Source and isolation
Recovered GitHub branch feature/dpo-checkout in .preview/design-one. It includes design one and the DPO foundation. The original project checkout, its uncommitted changes and the mobile app were not modified.

## Design direction
Light entertainment discovery for Namibia, using Ticketmaster South Africa (https://www.ticketmaster.co.za/) as a functional reference. Restrained colour, self-hosted Inter, readable dates/venues/prices, deliberate spacing, clear navigation and a simple two-step booking flow.

| Before | After | Why |
| --- | --- | --- |
| Glow backgrounds, gradient headings and repeated decorations | White surfaces, consistent type and event-led imagery | Put attention on the events |
| Placeholder testimonials and unverified sales counts | Removed | Keep the site credible |
| Long promotional copy and duplicated marquees | Short discovery sections and search/filter controls | Help visitors choose |
| Decorative confirmation barcode | Genuine QR ticket and authenticated check-in | Support actual admission |
| Design showcase iframe | Direct website navigation | Make discovery and booking usable |

## Brand
The user-confirmed folded multicolour ticket logo is recovered from the mobile app icon in public/brand/easy-tickets-logo.png. The header crops the original symbol and pairs it with readable Easy Tickets text. Preview event artwork remains illustrative; organisers can upload actual artwork.

## Implemented in the isolated copy
Discovery, filters, event details, booking, Supabase account flows, profiles, saved events, purchase history, organiser drafts/publication/artwork/ticket capacity, sales and attendee exports, event staff assignment, DPO verification, atomic ticket issuance, mobile QR tickets, SVG download, printing and sharing, and single-use staff check-in.

A protected reconciliation endpoint is prepared for paid orders when a buyer does not return. No scheduler has been deployed.

## Remaining setup and scope
The supplied Easy Tickets Supabase URL is recorded, but keys and schema compatibility still need verification. No remote migration, production payment, GitHub push or deployment was performed. Preview payments are disabled.

Apple Wallet requires Pass Type ID signing credentials. Google Wallet requires issuer credentials and publishing access. Pass generation remains unfinished. Automatic ticket email delivery, numbered seat maps, refunds/payouts and controlled ownership transfers also remain unfinished.

Browser/camera/visual QA was blocked when automatic approval review reached its usage limit. Local database, TypeScript and build checks do not replace these end-to-end checks.

See LAUNCH_CHECKLIST.md for connection and launch steps.
