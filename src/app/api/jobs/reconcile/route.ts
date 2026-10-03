import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { settlePayment } from "@/lib/payment-settlement";
import type { OrderRow } from "@/lib/orders-db";
import { json } from "@/lib/account-api";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function GET(req:Request) {
  const secret=process.env.CRON_SECRET;
  if(!secret) return json({error:"Reconciliation is not configured."},503);
  const actual=Buffer.from(req.headers.get("authorization") || ""),expected=Buffer.from("Bearer "+secret);
  if(actual.length!==expected.length || !timingSafeEqual(actual,expected)) return json({error:"Unauthorized."},401);
  const db=supabaseAdmin();
  const {data,error}=await db.from("orders").select("*").eq("status","pending").order("updated_at").limit(10);
  if(error) return json({error:"Could not load pending payments."},503);
  const counts={checked:0,paid:0,closed:0,review:0,errors:0};
  await Promise.all(((data ?? []) as OrderRow[]).map(async order => {
    try {
      if(!order.dpo_trans_token) {
        // No hosted checkout can be opened without a token returned to the buyer.
        if(Date.now()-Date.parse(order.created_at)>10*60_000) {
          const {error:updateError}=await db.from("orders").update({status:"failed",dpo_result_code:"token_missing"}).eq("id",order.id).eq("status","pending").is("dpo_trans_token",null);
          if(updateError) throw updateError;
          counts.closed++;
        }
      } else if(order.dpo_result_code==="amount_mismatch") {
        counts.review++;
await db.from("orders").update({dpo_result_code:"amount_mismatch"}).eq("id",order.id).eq("status","pending");
      } else {
        const settled=await settlePayment(order);
        if(settled.status==="paid") counts.paid++;
        else if(settled.status!=="pending") counts.closed++;
        else {
          const {error:updateError}=await db.from("orders").update({dpo_result_code:settled.dpo_result_code}).eq("id",order.id).eq("status","pending");
          if(updateError) throw updateError;
        }
      }
      counts.checked++;
    } catch { counts.errors++; await db.from("orders").update({updated_at:new Date().toISOString()}).eq("id",order.id).eq("status","pending"); }
  }));
  return json(counts);
}
