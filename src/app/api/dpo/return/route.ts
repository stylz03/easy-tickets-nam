import { NextResponse, type NextRequest } from "next/server";
import { signRef, verifyRef } from "@/lib/orders";
import { getOrderByRef } from "@/lib/orders-db";
import { settlePayment } from "@/lib/payment-settlement";
import { siteUrl } from "@/lib/site-url";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function settleWithRetry(order: Awaited<ReturnType<typeof getOrderByRef>>) {
  if (!order) return null;
  let latest = order;
  // DPO can redirect immediately after the card authorisation while
  // verifyToken still reports a transient pending result. Give the gateway
  // a few seconds to converge before showing a failure to the buyer.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    latest = await settlePayment(latest);
    if (latest.status !== "pending") return latest;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1500));
    const refreshed = await getOrderByRef(latest.ref);
    if (refreshed) latest = refreshed;
  }
  return latest;
}

export async function GET(req: NextRequest) {
  const q=req.nextUrl.searchParams, ref=q.get("ref") ?? "";
  const go=(path:string,params:Record<string,string>)=>{
    const url=new URL(path,siteUrl(req));
    for(const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
    const response=NextResponse.redirect(url,303);
    response.headers.set("Cache-Control","private, no-store");
    response.headers.set("Referrer-Policy","no-referrer");
    return response;
  };
  if(!verifyRef("return",ref,q.get("sig"))) return go("/checkout/failed",{reason:"invalid_order"});
  try {
    const order=await getOrderByRef(ref);
    if(!order) return go("/checkout/failed",{reason:"invalid_order"});
    const token=q.get("TransactionToken"),companyRef=q.get("CompanyRef");
    // TransID is a gateway transaction identifier, not a token. Verify only
    // the stored token, rather than trusting a token supplied in this URL.
    if((token && token!==order.dpo_trans_token)||(companyRef && companyRef!==order.ref))
      return go("/checkout/failed",{reason:"mismatch",ref});
    const final=await settleWithRetry(order);
    if (!final) return go("/checkout/failed",{reason:"invalid_order"});
    if(final.status==="paid") return go("/checkout/success",{ref,sig:signRef("receipt",ref)});
    if(final.status==="cancelled") return go("/checkout/cancelled",{ref,sig:signRef("receipt",ref)});
    return go("/checkout/failed",{reason:final.status==="pending"?"not_paid":"dpo_"+(final.dpo_result_code || "unknown"),ref});
  } catch {
    return go("/checkout/failed",{reason:"verify_error",ref});
  }
}
