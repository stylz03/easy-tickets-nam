import "server-only";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "./supabase-admin";

function eventExpired(eventDate:string|null,payload:Record<string,unknown>|null):boolean {
  if(!eventDate) return false;
  const rawEnd=typeof payload?.endsAt==="string" ? payload.endsAt : "";
  let endMs=Number.NaN;
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawEnd)) {
    endMs=Date.parse(rawEnd+":00+02:00");
  } else if(rawEnd) {
    endMs=Date.parse(rawEnd);
  }
  if(!Number.isFinite(endMs)) {
    const range=String(payload?.time ?? "").match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
    if(!range) return false;
    const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Windhoek",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(eventDate));
    const part=(type:string)=>Number(parts.find((item)=>item.type===type)?.value);
    const year=part("year"), month=part("month"), day=part("day");
    const startMinutes=part("hour")*60+part("minute");
    const endHour=Number(range[3]),endMinute=Number(range[4]);
    if(!Number.isFinite(year+month+day+startMinutes) || endHour>23 || endMinute>59) return false;
    const rollover=endHour*60+endMinute<=startMinutes ? 1 : 0;
    endMs=Date.UTC(year,month-1,day+rollover,endHour,endMinute)-2*60*60*1000;
  }
  return Number.isFinite(endMs) && Date.now()>=endMs;
}
export type Admission = { id:string; order_id:string; item_index:number; sequence:number; event_id:number; event_name:string; event_date:string|null; tier_name:string; holder_name:string; secret:string; status:"valid"|"used"|"void"|"expired"; checked_in_at:string|null };
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ticketCredential = (t:Pick<Admission,"id"|"secret">) => `ET1.${t.id}.${t.secret}`;
export const ticketLink = (t:Pick<Admission,"id"|"secret">) => `/tickets/${t.id}?key=${t.secret}`;
export async function ticketByKey(id:string,key:string) {
  if(!uuid.test(id) || !/^[a-f0-9]{64}$/.test(key)) return null;
  const {data,error} = await supabaseAdmin().from("website_tickets").select("*").eq("id",id).maybeSingle();
  if(error) throw new Error("Ticket services are unavailable.");
  if(!data) return null;
  const a=Buffer.from(key),b=Buffer.from(data.secret);
  if(a.length!==b.length || !timingSafeEqual(a,b)) return null;
  // A revoked order must never remain usable through an old ticket URL.
  const {data:order,error:orderError}=await supabaseAdmin().from("orders").select("status").eq("id",data.order_id).maybeSingle();
  if(orderError || order?.status!=="paid") return null;
  let admission=data as Admission;
  if(admission.status==="valid") {
    const {data:event,error:eventError}=await supabaseAdmin().from("website_events").select("payload").eq("id",admission.event_id).maybeSingle();
    if(eventError) throw new Error("Ticket services are unavailable.");
    if(eventExpired(admission.event_date,event?.payload as Record<string,unknown>|null)) {
      const {data:updated,error:updateError}=await supabaseAdmin().from("website_tickets").update({status:"expired"}).eq("id",admission.id).eq("status","valid").select("*").maybeSingle();
      if(updateError) throw new Error("Ticket services are unavailable.");
      admission=(updated ?? {...admission,status:"expired"}) as Admission;
    }
  }
  return admission;
}
export async function orderTickets(orderId:string) {
  const {data,error}=await supabaseAdmin().from("website_tickets").select("*").eq("order_id",orderId).order("item_index").order("sequence");
  if(error) throw new Error("Ticket services are unavailable.");
  return (data ?? []) as Admission[];
}
