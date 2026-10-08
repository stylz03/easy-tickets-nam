-- Apply once after the website platform migration. Delivery tables are server-only.
begin;

alter table public.orders add column if not exists ticket_email_sent_at timestamptz;
create index if not exists orders_unsent_ticket_email_idx
  on public.orders (paid_at) where status = 'paid' and ticket_email_sent_at is null;

create table if not exists public.website_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_purchased boolean not null default true,
  email_saved boolean not null default false,
  push_reminders boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.website_notification_preferences enable row level security;
revoke all on public.website_notification_preferences from anon, authenticated;
grant all on public.website_notification_preferences to service_role;
grant select, insert, update on public.website_notification_preferences to authenticated;
create policy own_notification_preferences on public.website_notification_preferences
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table if not exists public.website_notification_log (
  id text primary key,
  event_id integer references public.website_events(id) on delete cascade,
  recipient text not null,
  kind text not null check (kind in ('reminder-48h', 'reminder-24h', 'reminder-2h', 'push-reminder-48h', 'push-reminder-24h', 'push-reminder-2h')),
  provider_id text,
  sent_at timestamptz not null default now()
);
alter table public.website_notification_log enable row level security;
revoke all on public.website_notification_log from anon, authenticated;
grant all on public.website_notification_log to service_role;

create table if not exists public.website_push_subscriptions (
  endpoint text primary key check (length(endpoint) between 20 and 2048),
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null check (length(p256dh) between 40 and 200),
  auth_secret text not null check (length(auth_secret) between 10 and 100),
  created_at timestamptz not null default now()
);
create index if not exists website_push_subscriptions_user_idx on public.website_push_subscriptions(user_id);
alter table public.website_push_subscriptions enable row level security;
revoke all on public.website_push_subscriptions from anon, authenticated;
grant all on public.website_push_subscriptions to service_role;

commit;
