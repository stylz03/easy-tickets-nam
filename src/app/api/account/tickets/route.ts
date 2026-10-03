import { accountIdentity, json } from "@/lib/account-api";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { signRef } from "@/lib/orders";
export async function GET() {
  const identity = await accountIdentity(); if(!identity) return json({error:"Please sign in."},401);
  try {
    const {data,error} = await supabaseAdmin().from("orders").select("id,ref,event_name,event_date,items,amount,currency,status,created_at").eq("user_id",identity.user.id).order("created_at",{ascending:false}).limit(100);
    if(error) return json({error:"Your bookings are unavailable. Please try again."},503);
    return json({orders:(data ?? []).map(o => ({...o,receiptUrl:o.status === "paid" ? `/checkout/success?ref=${encodeURIComponent(o.ref)}&sig=${encodeURIComponent(signRef("receipt",o.ref))}` : null}))});
  } catch { return json({error:"Your bookings are unavailable. Please try again."},503); }
}
