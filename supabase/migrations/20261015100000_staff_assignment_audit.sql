begin;

create table public.website_event_staff_audit (
  id uuid primary key default gen_random_uuid(),
  event_id integer not null,
  organisation_id uuid not null,
  email text not null check (length(email) between 3 and 254),
  user_id uuid,
  assigned_by uuid,
  status text not null check (status in ('invited','assigned','accepted','revoked','expired')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now()
);

create index website_event_staff_audit_event_date_idx
  on public.website_event_staff_audit(event_id, invited_at desc);
create index website_event_staff_audit_user_idx
  on public.website_event_staff_audit(user_id, event_id);

alter table public.website_event_staff_audit enable row level security;
revoke all on public.website_event_staff_audit from anon, authenticated;
grant all on public.website_event_staff_audit to service_role;

insert into public.website_event_staff_audit(event_id,organisation_id,email,user_id,status,invited_at,expires_at)
select s.event_id,e.organisation_id,u.email,s.user_id,'assigned',now(),public.website_event_end_at(s.event_id)
from public.website_event_staff s
join public.website_events e on e.id=s.event_id
join auth.users u on u.id=s.user_id
where not exists (
 select 1 from public.website_event_staff_audit a
 where a.event_id=s.event_id and a.user_id=s.user_id
);

create or replace function public.assign_website_event_staff(p_event_id integer,p_email text) returns void
language plpgsql security definer set search_path='' as $$
declare v_user uuid;
begin
 if not exists(select 1 from public.website_events e join public.website_organiser_members m on m.organisation_id=e.organisation_id where e.id=p_event_id and m.user_id=auth.uid() and m.role in ('owner','manager')) then raise exception 'Event manager required'; end if;
 if public.website_event_end_at(p_event_id)<=now() then raise exception 'Event has ended'; end if;
 select id into v_user from auth.users where lower(email)=lower(p_email) and email_confirmed_at is not null;
 if v_user is null then raise exception 'Confirmed staff account required'; end if;
 insert into public.website_event_staff(event_id,user_id) values(p_event_id,v_user) on conflict do nothing;
end $$;
revoke execute on function public.assign_website_event_staff(integer,text) from public,anon;
grant execute on function public.assign_website_event_staff(integer,text) to authenticated;

create or replace function public.check_in_website_ticket(p_ticket_id uuid,p_secret text,p_event_id integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t public.website_tickets; v_end_at timestamptz;
begin
 if not exists(select 1 from public.website_event_staff where event_id=p_event_id and user_id=auth.uid()) then
  raise exception 'Staff assignment required';
 end if;
 v_end_at:=public.website_event_end_at(p_event_id);
 if v_end_at is not null and v_end_at<=now() then
  raise exception 'Event has ended';
 end if;
 select * into t from public.website_tickets
   where id=p_ticket_id and event_id=p_event_id and secret=p_secret for update;
 if t.id is null then
  return jsonb_build_object('ok',false,'error','Ticket not valid for this event.');
 end if;
 if t.status='used' then
  return jsonb_build_object('ok',false,'error','This ticket has already been used.');
 end if;
 if t.status='expired' then
  return jsonb_build_object('ok',false,'error','This ticket expired when the event ended.');
 end if;
 if t.status<>'valid' or not exists(select 1 from public.orders where id=t.order_id and status='paid') then
  return jsonb_build_object('ok',false,'error','This ticket is not valid.');
 end if;
 update public.website_tickets set status='used',checked_in_at=now(),checked_in_by=auth.uid()
   where id=t.id and status='valid';
 update public.website_event_staff_audit
   set status='accepted',accepted_at=coalesce(accepted_at,now()),last_activity_at=now()
   where event_id=p_event_id and user_id=auth.uid() and status in ('invited','assigned','accepted');
 return jsonb_build_object('ok',true,'holder',t.holder_name,'tier',t.tier_name);
end
$$;
revoke execute on function public.check_in_website_ticket(uuid,text,integer) from public,anon;
grant execute on function public.check_in_website_ticket(uuid,text,integer) to authenticated;

commit;
