import { accountIdentity, json, sameOrigin } from "@/lib/account-api";
export async function GET() {
  const identity = await accountIdentity(); if(!identity) return json({error:"Please sign in."},401);
  const {data,error} = await identity.client.from("website_profiles").select("full_name,phone,city").eq("user_id",identity.user.id).maybeSingle();
  if(error) return json({error:"Your profile is unavailable. Please try again."},503);
  return json({profile:data ?? {full_name:identity.user.user_metadata?.full_name ?? "",phone:"",city:""},email:identity.user.email});
}
export async function PATCH(req:Request) {
  if(!sameOrigin(req)) return json({error:"Invalid request."},403);
  const identity = await accountIdentity(); if(!identity) return json({error:"Please sign in."},401);
  const body = await req.json().catch(() => null); if(!body || typeof body.name !== "string" || body.name.trim().length<2 || body.name.length>100 || typeof body.phone !== "string" || body.phone.length>30 || typeof body.city !== "string" || body.city.length>60) return json({error:"Check your profile details."},400);
  const {error} = await identity.client.from("website_profiles").upsert({user_id:identity.user.id,full_name:body.name.trim(),phone:body.phone.trim(),city:body.city.trim()});
  if(error) return json({error:"Could not save your profile."},503); return json({ok:true});
}
