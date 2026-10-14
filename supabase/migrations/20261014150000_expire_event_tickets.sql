-- Expire tickets when their event ends. Namibia-local event times use UTC+02:00.
begin;

alter table public.website_tickets drop constraint website_tickets_status_check;
alter table public.website_tickets add constraint website_tickets_status_check
  check (status in ('valid','used','void','expired'));

create or replace function public.website_event_end_at(p_event_id integer)
returns timestamptz
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  e public.website_events;
  end_value text;
  time_range text[];
  start_local timestamp;
  end_local timestamp;
begin
  select * into e from public.website_events where id=p_event_id;
  if not found then return null; end if;

  end_value:=e.payload->>'endsAt';
  if end_value ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$' then
    return replace(end_value,'T',' ')::timestamp at time zone 'Africa/Windhoek';
  elsif end_value ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$' then
    return end_value::timestamptz;
  end if;

  time_range:=regexp_match(coalesce(e.payload->>'time',''),'([0-2]?[0-9]):([0-5][0-9])\s*[–-]\s*([0-2]?[0-9]):([0-5][0-9])');
  if time_range is null or time_range[3]::integer>23 then return null; end if;

  start_local:=e.starts_at at time zone 'Africa/Windhoek';
  end_local:=date_trunc('day',start_local)+make_interval(hours=>time_range[3]::integer,mins=>time_range[4]::integer);
  if end_local<=start_local then end_local:=end_local+interval '1 day'; end if;
  return end_local at time zone 'Africa/Windhoek';
end;
$$;
revoke all on function public.website_event_end_at(integer) from public,anon,authenticated;

update public.website_tickets t
set status='expired'
from public.orders o
where o.id=t.order_id
  and o.status='paid'
  and t.status='valid'
  and public.website_event_end_at(t.event_id)<=now();

create or replace function public.check_in_website_ticket(p_ticket_id uuid,p_secret text,p_event_id integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t public.website_tickets; v_end_at timestamptz;
begin
  if not exists(select 1 from public.website_event_staff where event_id=p_event_id and user_id=auth.uid()) then
    raise exception 'Staff assignment required';
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

  v_end_at:=public.website_event_end_at(t.event_id);
  if v_end_at is not null and v_end_at<=now() then
    update public.website_tickets set status='expired' where id=t.id and status='valid';
    return jsonb_build_object('ok',false,'error','This ticket expired when the event ended.');
  end if;

  update public.website_tickets set status='used',checked_in_at=now(),checked_in_by=auth.uid()
    where id=t.id and status='valid';
  return jsonb_build_object('ok',true,'holder',t.holder_name,'tier',t.tier_name);
end
$$;
revoke execute on function public.check_in_website_ticket(uuid,text,integer) from public,anon;
grant execute on function public.check_in_website_ticket(uuid,text,integer) to authenticated;

commit;
