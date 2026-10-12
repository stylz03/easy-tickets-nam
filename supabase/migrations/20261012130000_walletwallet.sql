begin;
alter table public.website_tickets add column if not exists walletwallet_serial text;
alter table public.website_tickets add column if not exists walletwallet_share_url text;
alter table public.website_tickets add column if not exists walletwallet_google_url text;
alter table public.website_tickets add column if not exists walletwallet_created_at timestamptz;
create unique index if not exists website_tickets_walletwallet_serial_idx on public.website_tickets(walletwallet_serial) where walletwallet_serial is not null;
commit;
