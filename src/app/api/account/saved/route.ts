import { accountIdentity, json, sameOrigin } from "@/lib/account-api";
export async function GET() {
  const identity = await accountIdentity(); if(!identity) return json({error:"Please sign in."},401);
  const {data,error} = await identity.client.from("website_saved_events").select("event_id").eq("user_id",identity.user.id);
  return error ? json({error:"Saved events are unavailable."},503) : json({ids:(data ?? []).map(row => row.event_id)});
}
async function mutate(req:Request,remove:boolean) {
  if(!sameOrigin(req)) return json({error:"Invalid request."},403);
  const identity = await accountIdentity(); if(!identity) return json({error:"Please sign in."},401);
  const body = await req.json().catch(() => null); if(!Number.isSafeInteger(body?.eventId) || body.eventId<1) return json({error:"Invalid event."},400);
  const query = identity.client.from("website_saved_events");
  const {error} = remove ? await query.delete().eq("user_id",identity.user.id).eq("event_id",body.eventId) : await query.upsert({user_id:identity.user.id,event_id:body.eventId},{onConflict:"user_id,event_id",ignoreDuplicates:true});
  return error ? json({error:"Could not update saved events."},503) : json({ok:true});
}
export const POST = (req:Request) => mutate(req,false);
export const DELETE = (req:Request) => mutate(req,true);
