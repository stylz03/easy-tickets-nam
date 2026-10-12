# Ticket wallet and offline rollout

## WalletWallet integration

The ticket page now has an **Add to Wallet** link backed by WalletWallet's hosted install page. The server creates one pass using the ticket's existing `ET1` QR credential, stores WalletWallet's serial and share URLs on the ticket, and redirects the customer to the device-aware Apple/Google install page.

Add these Vercel environment variables:

```text
EASY_TICKETS_WALLETS_ENABLED=true
WALLETWALLET_API_KEY=ww_live_...
APP_BASE_URL=https://easyticketsnam-staging.vercel.app
```

The API key remains server-only. WalletWallet's free tier supports up to 1,000 passes per month. The initial pass design sends the event artwork as the pass background, alongside the event, tier, holder, date, Easy Tickets logo, QR credential and blue theme. If an event has no public artwork, the pass falls back to the colour theme; you can refine the visual template in the WalletWallet dashboard.

## What works now

- Every paid admission has one unique `ET1` credential and QR code.
- A customer can save an opened ticket for offline use. The service worker keeps the exact private ticket page and the static files it needs, then serves it when the network is unavailable.
- The customer can remove the offline copy from the ticket page. Because the ticket URL contains the admission secret, shared devices should be cleared after the event.
- Gate staff can scan the same credential from the website, a downloaded ticket, Apple Wallet or Google Wallet. The database remains the source of truth and rejects a second admission.

Offline access must be prepared while connected: open the ticket and tap **Save offline**. It cannot retrieve a ticket that the device has never received.

## Google Wallet

Google's web flow issues an event-ticket object through a signed JWT and opens `https://pay.google.com/gp/v/save/<signed_jwt>`.

1. Create or select a Google Wallet issuer account in the Google Pay & Wallet Console.
2. Enable the Google Wallet API in a Google Cloud project.
3. Create a service account and authorize it in the Wallet console.
4. Create an Event Ticket class for Easy Tickets. Demo passes show **TEST ONLY** until Google grants publishing access.
5. Add the server-only deployment values listed below. Preserve private-key newlines when adding the key to Vercel.
6. Add a server route that verifies the ticket secret with `ticketByKey`, creates a unique Event Ticket object ID, places the existing `ET1` credential in its QR barcode, signs the save JWT with RS256, and redirects to the Google save URL.
7. Show the official **Add to Google Wallet** button only when the route and all credentials are available.

Required deployment values:

- `GOOGLE_WALLET_ISSUER_ID`
- `GOOGLE_WALLET_CLASS_ID`
- `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_WALLET_PRIVATE_KEY`

Official setup: <https://developers.google.com/wallet/tickets/events>

## Apple Wallet

Apple Wallet requires a signed `.pkpass`; an ordinary QR image renamed to `.pkpass` will not work.

1. Join the Apple Developer Program and register an Easy Tickets Pass Type ID.
2. Create the Pass Type ID certificate and download Apple's current WWDR intermediate certificate.
3. Export the signer certificate and private key as PEM, encode the files for server-only Vercel environment storage, and keep the originals in secure credential storage.
4. Add a server route that verifies the ticket secret with `ticketByKey`, builds an `eventTicket` pass, embeds the existing `ET1` credential as a QR barcode, signs the manifest, and responds with `application/vnd.apple.pkpass`.
5. Show the official **Add to Apple Wallet** badge only when pass generation succeeds.
6. Start with static passes. A later pass web service can update or visually invalidate installed passes, while the current database check-in rule already prevents reuse.

Required deployment values:

- `APPLE_PASS_TYPE_IDENTIFIER`
- `APPLE_TEAM_IDENTIFIER`
- `APPLE_PASS_SIGNER_CERT_BASE64`
- `APPLE_PASS_SIGNER_KEY_BASE64`
- `APPLE_PASS_SIGNER_KEY_PASSPHRASE`
- `APPLE_WWDR_CERT_BASE64`

Official setup: <https://developer.apple.com/documentation/walletpasses>

## Release gate

Keep `EASY_TICKETS_WALLETS_ENABLED` unset until both generated passes have been installed on real devices and their QR codes have passed the same first-scan/second-scan rejection test as the web ticket. Never expose certificate material, the Google private key or ticket secrets through `NEXT_PUBLIC_` variables.
