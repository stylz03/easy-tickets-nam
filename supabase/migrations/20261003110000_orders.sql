-- Easy Tickets Namibia: orders for the DPO Pay checkout.
-- Server-only access: RLS is enabled with NO policies, and anon/authenticated
-- have no table privileges. Only the service role (used by the Next.js
-- route handlers) can read/write.

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  ref              text not null unique check (ref ~ '^ET-[0-9]{8}-[0-9A-F]{8}$'),
  event_id         integer not null,
  event_name       text not null,
  event_date       timestamptz,
  items            jsonb not null,
  amount           numeric(12,2) not null check (amount > 0),
  currency         text not null default 'NAD',
  buyer_name       text not null,
  buyer_email      text not null,
  buyer_phone      text,
  status           text not null default 'pending'
                   check (status in ('pending','paid','failed','cancelled')),
  dpo_trans_token  text unique,
  dpo_trans_ref    text,
  dpo_result_code  text,
  dpo_approval     text,
  created_at       timestamptz not null default now(),
  paid_at          timestamptz,
  updated_at       timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_buyer_email_idx on public.orders (buyer_email);

create or replace function public.orders_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.orders_set_updated_at();

alter table public.orders enable row level security;
-- (intentionally no policies)

revoke all on table public.orders from anon, authenticated;
grant all on table public.orders to service_role;
revoke execute on function public.orders_set_updated_at() from public, anon, authenticated;
