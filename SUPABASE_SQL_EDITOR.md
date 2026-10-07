# Easy Tickets: Supabase SQL Editor setup

Target project: `mjnvfiixmywzlfznqvnf` (`https://mjnvfiixmywzlfznqvnf.supabase.co`). Check that exact project reference in the dashboard before running SQL. These scripts are intended for the Easy Tickets project only; they do not alter the DPO merchant.

The website tables are namespaced with `website_` to avoid changing unrelated mobile-app tables. The `orders` table is shared by the website checkout. **Do not paste all files into one SQL Editor tab.** Run each complete file in a separate query, in the order below, and keep the successful query history. SQL Editor runs do not automatically create Supabase CLI migration-history entries.

## 1. Preflight: run this first

```sql
select
  to_regclass('public.orders') as orders,
  to_regclass('public.website_organisations') as website_organisations,
  to_regclass('public.website_events') as website_events,
  to_regclass('public.website_tickets') as website_tickets,
  to_regclass('public.website_profiles') as website_profiles;
```

If **any** result is not `null`, stop and share the table names and existing migration history before applying anything. The migrations are designed for an empty website application schema and should not be rerun over an existing or partially installed one. Supabase's own `auth` and `storage` schemas are expected to exist.

## 2. Run the three files in order

1. [`supabase/migrations/20261003110000_orders.sql`](supabase/migrations/20261003110000_orders.sql) — orders, private access, status update trigger.
2. [`supabase/migrations/20261003160000_website_platform.sql`](supabase/migrations/20261003160000_website_platform.sql) — organisations, profiles, events, ticket and saved-event tables, staff, RLS, database functions, check-in, and public event-artwork bucket.
3. [`supabase/seed.sql`](supabase/seed.sql) — six **example** events and 18 ticket tiers used by the preview catalogue. Every tier capacity is zero; this seed cannot create saleable inventory.

Open the linked file from the `design-1-live` GitHub branch, copy its **entire** SQL text into a new SQL Editor query, run it, and wait for success before proceeding to the next file. If a query errors, copy the exact error and stop. Do not run the next file or retry the failed one without checking what was committed.

## 3. Verify the result

```sql
select
  (select count(*) from public.website_events where id between 1 and 6) as example_events,
  (select count(*) from public.website_events e
    cross join lateral jsonb_array_elements(e.payload -> 'tiers') tier
    where e.id between 1 and 6) as example_tiers,
  (select count(*) from public.website_events e
    cross join lateral jsonb_array_elements(e.payload -> 'tiers') tier
    where e.id between 1 and 6 and (tier ->> 'capacity')::integer = 0) as zero_capacity_tiers,
  (select count(*) from storage.buckets where id = 'website-event-images') as artwork_buckets;
```

Expected: `6` example events, `18` tiers, `18` zero-capacity tiers, and `1` artwork bucket. The website remains in preview mode until its environment keys, Auth redirect URLs, a real organiser account, verified event details, and real ticket capacities are configured. Run a controlled payment-to-ticket test before turning off the two preview flags. See [`DEPLOY_NOTES.md`](DEPLOY_NOTES.md) for those settings.
