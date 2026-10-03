# Recovery notes (Easy Tickets Namibia, deployment dpl_4qtXqry4bZPAQALvpp6iF3NxQPjY)

Updated 3 Oct 2026 (SAST). Recovery is complete.

## How
The full source tree came from the Vercel REST API, using the box's Vercel CLI login (stylz03) with read-only GET calls:
- `GET /v6/deployments/{id}/files?teamId=team_4L57wxEwL054TUtKyKbpxDJV` returns the file tree.
- `GET /v7/deployments/{id}/files/{uid}` returns each file's contents, base64-encoded in `data`.

## Verification
All 39 source files in the deployment were downloaded, and every one matches the SHA1 (`uid`) that Vercel lists for it: 39 of 39 match, 0 mismatch.
That covers the files that were missing before:
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/page.tsx` (the showcase page at /)
- `src/app/(designs)/design/{1,2,3}/page.tsx`
- `package-lock.json` (236 KB)

The files recovered earlier (configs, docs, layout, globals.css, Logo.tsx, svgs, favicon, the 15 design PNGs) were byte-identical to the API originals, so nothing had to be overwritten.

## Skipped on purpose
- `tsconfig.tsbuildinfo` (a build artifact)
- Build outputs (`out/*` lambdas)

`.gitignore` was not part of the CLI upload, so it was written by hand. It covers .env*, !.env.example, node_modules, .next, .vercel and *.tsbuildinfo.

## Build
`npm ci && npm run build` (Next.js 16.2.9, Turbopack) succeeds with no code changes. Routes: / , /_not-found , /design/1 , /design/2 , /design/3 (all static).
