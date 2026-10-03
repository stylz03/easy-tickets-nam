import "server-only";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "./supabase-admin";
export type Admission = { id:string; order_id:string; item_index:number; sequence:number; event_id:number; event_name:string; event_date:string|null; tier_name:string; holder_name:string; secret:string; status:"valid"|"used"|"void"; checked_in_at:string|null };
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
  return data as Admission;
}
export async function orderTickets(orderId:string) {
  const {data,error}=await supabaseAdmin().from("website_tickets").select("*").eq("order_id",orderId).order("item_index").order("sequence");
  if(error) throw new Error("Ticket services are unavailable.");
  return (data ?? []) as Admission[];
}
